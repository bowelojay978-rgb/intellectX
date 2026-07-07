import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { isLearnerVisibleCourseRecord, learnerCourseVisibilityOptions } from "./lib/courseWorkflow";
import { resolveLearnerUserKey } from "./lib/identity";

async function getLearnerVisibleCourseByStableId(ctx: any, courseStableId: string) {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", courseStableId))
    .first();

  if (!course || !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions)) {
    return null;
  }

  return course;
}

export const getLessonsByCourse = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const course = await getLearnerVisibleCourseByStableId(ctx, args.courseStableId);

    if (!course) {
      return [];
    }

    return await ctx.db
      .query("lessons")
      .withIndex("by_course_stable_id", (q) => q.eq("courseStableId", args.courseStableId))
      .collect();
  },
});

export const getLessonById = queryGeneric({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_stable_id", (q) => q.eq("stableId", args.lessonId))
      .first();

    if (!lesson) {
      return null;
    }

    const course = await getLearnerVisibleCourseByStableId(ctx, lesson.courseStableId);

    if (!course) {
      return null;
    }

    return lesson;
  },
});

export const updateLessonProgress = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    lessonId: v.string(),
    status: v.string(),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .filter((q) => q.eq(q.field("lessonId"), args.lessonId))
      .first();

    const nextProgress = Math.min(Math.max(args.progress, 0), 100);
    const nextStatus = nextProgress >= 100 ? "completed" : args.status;

    if (!existing) {
      return await ctx.db.insert("lessonProgress", {
        userKey,
        lessonId: args.lessonId,
        status: nextStatus,
        progress: nextProgress,
        updatedAt: Date.now(),
      });
    }

    const mergedProgress = Math.max(existing.progress, nextProgress);

    await ctx.db.patch(existing._id, {
      status: mergedProgress >= 100 ? "completed" : nextStatus,
      progress: mergedProgress,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});
