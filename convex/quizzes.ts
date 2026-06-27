import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

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
    userKey: v.string(),
    quizId: v.string(),
    score: v.number(),
    totalQuestions: v.number(),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quizAttempts", {
      ...args,
      completedAt: Date.now(),
    });
  },
});
