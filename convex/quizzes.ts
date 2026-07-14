import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { isLearnerVisibleCourseRecord, learnerCourseVisibilityOptions } from "./lib/courseWorkflow";
import {
  gradeQuizAnswers,
  normalizeQuizSubmissionId,
  quizAnswersMatch,
  toLearnerQuizQuestionPayload,
  validateQuizAnswer,
} from "./lib/quizIntegrity";
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

function hasFreeLearnerAccess(record: { accessLevel?: string }) {
  return record.accessLevel !== "paid";
}

async function getQuestionRecordsByQuizStableId(ctx: any, quizStableId: string) {
  const questions = await ctx.db
    .query("questions")
    .withIndex("by_quiz_stable_id", (q: any) => q.eq("quizStableId", quizStableId))
    .collect();

  return questions.sort((left: any, right: any) => left.order - right.order);
}

async function getAccessibleQuiz(ctx: any, quizStableId: string) {
  const quiz = await ctx.db
    .query("quizzes")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", quizStableId))
    .first();

  if (!quiz || !hasFreeLearnerAccess(quiz)) {
    return null;
  }

  const course = await getLearnerVisibleCourseByStableId(ctx, quiz.courseStableId);

  if (!course || !hasFreeLearnerAccess(course)) {
    return null;
  }

  return { quiz, course };
}

async function buildLearnerQuizPayload(ctx: any, quiz: any) {
  const questions = await getQuestionRecordsByQuizStableId(ctx, quiz.stableId);

  return {
    ...quiz,
    questions: questions.map(toLearnerQuizQuestionPayload),
  };
}

function buildQuizAttemptResult(attempt: any, quizTitle: string, questions: any[]) {
  const grading = gradeQuizAnswers(questions, attempt.answers);

  return {
    attemptId: attempt._id,
    quizId: attempt.quizId,
    quizTitle,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage ?? grading.percentage,
    completedAt: attempt.completedAt,
    answers: [...attempt.answers],
    questionResults: grading.questionResults,
  };
}

export const listQuizzes = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();
    const visibleQuizzes = [];

    for (const quiz of quizzes) {
      const course = await getLearnerVisibleCourseByStableId(ctx, quiz.courseStableId);

      if (!course || !hasFreeLearnerAccess(course) || !hasFreeLearnerAccess(quiz)) {
        continue;
      }

      visibleQuizzes.push(await buildLearnerQuizPayload(ctx, quiz));
    }

    return visibleQuizzes;
  },
});

export const getQuizzesByCourse = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const course = await getLearnerVisibleCourseByStableId(ctx, args.courseStableId);

    if (!course || !hasFreeLearnerAccess(course)) {
      return [];
    }

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course_stable_id", (q) => q.eq("courseStableId", args.courseStableId))
      .collect();

    return await Promise.all(
      quizzes.filter(hasFreeLearnerAccess).map(async (quiz) => await buildLearnerQuizPayload(ctx, quiz)),
    );
  },
});

export const getQuizById = queryGeneric({
  args: { quizId: v.string() },
  handler: async (ctx, args) => {
    const accessible = await getAccessibleQuiz(ctx, args.quizId);

    if (!accessible) {
      return null;
    }

    return await buildLearnerQuizPayload(ctx, accessible.quiz);
  },
});

export const checkQuizAnswer = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    quizId: v.string(),
    questionId: v.string(),
    answer: v.number(),
  },
  handler: async (ctx, args) => {
    await resolveLearnerUserKey(ctx, args);
    const accessible = await getAccessibleQuiz(ctx, args.quizId);

    if (!accessible) {
      throw new Error("Quiz is not available to this learner.");
    }

    const questions = await getQuestionRecordsByQuizStableId(ctx, args.quizId);
    const question = questions.find((item: any) => item.stableId === args.questionId);

    if (!question) {
      throw new Error("Quiz question does not exist.");
    }

    const answer = validateQuizAnswer(question, args.answer);

    if (answer < 0) {
      throw new Error("A question check requires a selected answer.");
    }

    return {
      questionId: question.stableId,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      correct: answer === question.answerIndex,
    };
  },
});

export const submitQuizAttempt = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    quizId: v.string(),
    submissionId: v.string(),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const accessible = await getAccessibleQuiz(ctx, args.quizId);

    if (!accessible) {
      throw new Error("Quiz is not available to this learner.");
    }

    const submissionId = normalizeQuizSubmissionId(args.submissionId);
    const questions = await getQuestionRecordsByQuizStableId(ctx, args.quizId);
    const grading = gradeQuizAnswers(questions, args.answers);
    const existingAttempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_submission_id", (q: any) => q.eq("userKey", userKey).eq("submissionId", submissionId))
      .first();

    if (existingAttempt) {
      if (existingAttempt.quizId !== args.quizId || !quizAnswersMatch(existingAttempt.answers, grading.answers)) {
        throw new Error("Quiz submission ID cannot be reused for different attempt data.");
      }

      return buildQuizAttemptResult(existingAttempt, accessible.quiz.title, questions);
    }

    const completedAt = Date.now();
    const attemptId = await ctx.db.insert("quizAttempts", {
      userKey,
      quizId: accessible.quiz.stableId,
      submissionId,
      score: grading.score,
      totalQuestions: grading.totalQuestions,
      answers: grading.answers,
      quizTitle: accessible.quiz.title,
      percentage: grading.percentage,
      completedAt,
    });

    return {
      attemptId,
      quizId: accessible.quiz.stableId,
      quizTitle: accessible.quiz.title,
      score: grading.score,
      totalQuestions: grading.totalQuestions,
      percentage: grading.percentage,
      completedAt,
      answers: grading.answers,
      questionResults: grading.questionResults,
    };
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
    const visibleAttempts = [];

    for (const attempt of attempts) {
      const quiz = await ctx.db
        .query("quizzes")
        .withIndex("by_stable_id", (q) => q.eq("stableId", attempt.quizId))
        .first();

      if (!quiz) {
        continue;
      }

      const course = await getLearnerVisibleCourseByStableId(ctx, quiz.courseStableId);

      if (course && hasFreeLearnerAccess(course) && hasFreeLearnerAccess(quiz)) {
        visibleAttempts.push({
          ...attempt,
          quizTitle: attempt.quizTitle ?? quiz.title,
          courseStableId: quiz.courseStableId,
          courseTitle: course.title,
        });
      }
    }

    // Hydration and streak calculation depend on complete visible history.
    // Recent-attempt UI limits its own display independently.
    return visibleAttempts.sort((left, right) => right.completedAt - left.completedAt);
  },
});
