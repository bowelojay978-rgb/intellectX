import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { isLearnerVisibleCourseRecord, learnerCourseVisibilityOptions } from "./lib/courseWorkflow";
import { resolveLearnerUserKey } from "./lib/identity";
import {
  COMPLETED,
  IN_PROGRESS,
  normalizeLessonProgressWrite,
} from "./lib/lessonProgressPolicy";

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

function hasFreeLearnerAccess(record: { accessLevel?: string }) {
  return record.accessLevel !== "paid";
}

async function getLearnerVisibleLessonByStableId(ctx: any, lessonId: string) {
  const lesson = await ctx.db
    .query("lessons")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", lessonId))
    .first();

  if (!lesson || !hasFreeLearnerAccess(lesson)) {
    return null;
  }

  const course = await getLearnerVisibleCourseByStableId(ctx, lesson.courseStableId);

  if (!course || !hasFreeLearnerAccess(course)) {
    return null;
  }

  return lesson;
}

async function resolveLessonMedia(ctx: any, lesson: any) {
  const attachments = await ctx.db
    .query("staffMediaUploads")
    .withIndex("by_course_lesson", (q: any) =>
      q.eq("courseStableId", lesson.courseStableId).eq("lessonStableId", lesson.stableId),
    )
    .collect();
  const video = attachments
    .filter((record: any) => record.kind === "video")
    .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];
  const poster = attachments
    .filter((record: any) => record.kind === "poster")
    .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];

  return {
    ...lesson,
    videoUrl: video ? await ctx.storage.getUrl(video.storageId) : lesson.videoUrl,
    posterUrl: poster ? await ctx.storage.getUrl(poster.storageId) : lesson.posterUrl,
  };
}

export const getLessonsByCourse = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const course = await getLearnerVisibleCourseByStableId(ctx, args.courseStableId);

    if (!course || !hasFreeLearnerAccess(course)) {
      return [];
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course_stable_id", (q) => q.eq("courseStableId", args.courseStableId))
      .collect();
    const visibleLessons = lessons.filter(hasFreeLearnerAccess);

    return await Promise.all(visibleLessons.map((lesson) => resolveLessonMedia(ctx, lesson)));
  },
});

export const listLessons = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    const visibleLessons = [];

    for (const lesson of lessons) {
      const course = await getLearnerVisibleCourseByStableId(ctx, lesson.courseStableId);

      if (course && hasFreeLearnerAccess(course) && hasFreeLearnerAccess(lesson)) {
        visibleLessons.push(await resolveLessonMedia(ctx, lesson));
      }
    }

    return visibleLessons;
  },
});

export const getLessonById = queryGeneric({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    const lesson = await getLearnerVisibleLessonByStableId(ctx, args.lessonId);

    if (!lesson) {
      return null;
    }

    return await resolveLessonMedia(ctx, lesson);
  },
});

export const updateLessonProgress = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    lessonId: v.string(),
    status: v.union(v.literal(IN_PROGRESS), v.literal(COMPLETED)),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const lesson = await getLearnerVisibleLessonByStableId(ctx, args.lessonId);

    if (!lesson) {
      throw new Error("Lesson not found or unavailable to this learner.");
    }

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q: any) => q.eq("userKey", userKey).eq("lessonId", args.lessonId))
      .first();
    const normalized = normalizeLessonProgressWrite({
      requestedStatus: args.status,
      requestedProgress: args.progress,
      existingProgress: existing?.progress,
    });

    if (!existing) {
      return await ctx.db.insert("lessonProgress", {
        userKey,
        lessonId: lesson.stableId,
        status: normalized.status,
        progress: normalized.progress,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      status: normalized.status,
      progress: normalized.progress,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});
