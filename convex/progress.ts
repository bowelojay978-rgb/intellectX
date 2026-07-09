import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";
import { isLearnerVisibleCourseRecord, learnerCourseVisibilityOptions } from "./lib/courseWorkflow";

function hasFreeLearnerAccess(record: { accessLevel?: string }) {
  return record.accessLevel !== "paid";
}

async function getLearnerVisibleLessonByStableId(ctx: any, lessonId: string) {
  const lesson = await ctx.db
    .query("lessons")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", lessonId))
    .first();

  if (!lesson) {
    return null;
  }

  const course = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", lesson.courseStableId))
    .first();

  if (
    !course ||
    !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions) ||
    !hasFreeLearnerAccess(course) ||
    !hasFreeLearnerAccess(lesson)
  ) {
    return null;
  }

  return { lesson, course };
}

async function getLearnerVisibleLessonProgress(ctx: any, userKey: string) {
  const lessonProgress = await ctx.db
    .query("lessonProgress")
    .withIndex("by_user", (q: any) => q.eq("userKey", userKey))
    .collect();
  const visibleProgress = [];

  for (const progress of lessonProgress) {
    const match = await getLearnerVisibleLessonByStableId(ctx, progress.lessonId);

    if (match) {
      visibleProgress.push({
        ...progress,
        lessonTitle: match.lesson.title,
        courseStableId: match.lesson.courseStableId,
        courseTitle: match.course.title,
      });
    }
  }

  return visibleProgress;
}

export const getDashboardSummary = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const lessonProgress = await getLearnerVisibleLessonProgress(ctx, userKey);
    const quizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();

    return { lessonProgress, quizAttempts };
  },
});

export const getProgressSummary = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const lessonProgress = await getLearnerVisibleLessonProgress(ctx, userKey);
    const quizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();
    const studyStats = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .first();

    return { lessonProgress, quizAttempts, studyStats };
  },
});

export const getProfileLearningSummary = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const studyStats = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .first();

    return { userKey, studyStats };
  },
});
