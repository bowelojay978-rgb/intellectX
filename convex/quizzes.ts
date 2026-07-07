import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";

export const listQuizzes = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();
    return await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz_stable_id", (q) => q.eq("quizStableId", quiz.stableId))
          .collect();

        return { ...quiz, questions };
      }),
    );
  },
});

export const getQuizById = queryGeneric({
  args: { quizId: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("by_stable_id", (q) => q.eq("stableId", args.quizId))
      .first();
    if (!quiz) return null;
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz_stable_id", (q) => q.eq("quizStableId", args.quizId))
      .collect();

    return { ...quiz, questions };
  },
});

export const submitQuizAttempt = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    quizId: v.string(),
    score: v.number(),
    totalQuestions: v.number(),
    answers: v.array(v.number()),
    quizTitle: v.optional(v.string()),
    percentage: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    return await ctx.db.insert("quizAttempts", {
      userKey,
      quizId: args.quizId,
      score: args.score,
      totalQuestions: args.totalQuestions,
      answers: args.answers,
      quizTitle: args.quizTitle,
      percentage: args.percentage,
      completedAt: args.completedAt ?? Date.now(),
    });
  },
});

export const getQuizAttempts = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();

    return attempts.sort((left, right) => right.completedAt - left.completedAt).slice(0, 20);
  },
});
