import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const getLessonsByCourse = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course_stable_id", (q) => q.eq("courseStableId", args.courseStableId))
      .collect();
  },
});

export const getLessonById = queryGeneric({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_stable_id", (q) => q.eq("stableId", args.lessonId))
      .first();
  },
});

export const updateLessonProgress = mutationGeneric({
  args: {
    userKey: v.string(),
    lessonId: v.string(),
    status: v.string(),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("lessonProgress", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
