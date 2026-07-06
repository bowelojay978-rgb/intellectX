import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";

export const getDashboardSummary = queryGeneric({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const lessonProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();
    const quizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();

    return { lessonProgress, quizAttempts };
  },
});

export const getProgressSummary = queryGeneric({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const lessonProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();
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
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const studyStats = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .first();

    return { userKey, studyStats };
  },
});
