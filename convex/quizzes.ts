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

async function getQuestionsByQuizStableId(ctx: any, quizStableId: string) {
  const questions = await ctx.db
    .query("questions")
    .withIndex("by_quiz_stable_id", (q: any) => q.eq("quizStableId", quizStableId))
    .collect();

  return questions.sort((left: any, right: any) => left.order - right.order);
}

export const listQuizzes = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();
    const visibleQuizzes = [];

    for (const quiz of quizzes) {
      const course = await getLearnerVisibleCourseByStableId(ctx, quiz.courseStableId);

      if (!course) {
        continue;
      }

      visibleQuizzes.push({ ...quiz, questions: await getQuestionsByQuizStableId(ctx, quiz.stableId) });
    }

    return visibleQuizzes;
  },
});

export const getQuizzesByCourse = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const course = await getLearnerVisibleCourseByStableId(ctx, args.courseStableId);

    if (!course) {
      return [];
    }

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course_stable_id", (q) => q.eq("courseStableId", args.courseStableId))
      .collect();

    return await Promise.all(
      quizzes.map(async (quiz) => ({ ...quiz, questions: await getQuestionsByQuizStableId(ctx, quiz.stableId) })),
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
    const course = await getLearnerVisibleCourseByStableId(ctx, quiz.courseStableId);

    if (!course) {
      return null;
    }

    return { ...quiz, questions: await getQuestionsByQuizStableId(ctx, args.quizId) };
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
