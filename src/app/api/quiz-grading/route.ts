import "server-only";

import { getQuiz } from "@/data/quizzes";
import {
  gradeQuizAnswers,
  normalizeQuizSubmissionId,
  validateQuizAnswer,
  type AuthoritativeQuizQuestionRecord,
} from "../../../../convex/lib/quizIntegrity";
import { getSeedQuizAnswer } from "../../../../convex/seedQuizAnswers";

function unavailableResponse() {
  return Response.json({ error: "Local quiz grading fallback is unavailable." }, { status: 404 });
}

function errorResponse(error: unknown, status = 400) {
  return Response.json(
    { error: error instanceof Error ? error.message : "Unable to grade this quiz request." },
    { status },
  );
}

function getAuthoritativeFallbackQuiz(quizId: string) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const questions: AuthoritativeQuizQuestionRecord[] = quiz.questions.map((question, order) => {
    const answer = getSeedQuizAnswer(quiz.id, question.id);

    return {
      stableId: question.id,
      prompt: question.prompt,
      choices: question.choices,
      answerIndex: answer.answerIndex,
      explanation: answer.explanation,
      order,
    };
  });

  return { quiz, questions };
}

export async function POST(request: Request) {
  // This route exists only so local development and CI can exercise the same
  // server-authoritative quiz UX without restoring answer keys to browser data.
  // Production and configured Convex environments fail closed to Convex only.
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_CONVEX_URL) {
    return unavailableResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(new Error("Quiz grading request must contain valid JSON."));
  }

  if (!body || typeof body !== "object") {
    return errorResponse(new Error("Quiz grading request is invalid."));
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.quizId !== "string") {
    return errorResponse(new Error("Quiz ID is required."));
  }

  const authoritative = getAuthoritativeFallbackQuiz(payload.quizId);

  if (!authoritative) {
    return errorResponse(new Error("Quiz is not available."), 404);
  }

  try {
    if (payload.action === "check") {
      if (typeof payload.questionId !== "string" || typeof payload.answer !== "number") {
        throw new Error("Question ID and numeric answer are required.");
      }

      const question = authoritative.questions.find((item) => item.stableId === payload.questionId);

      if (!question) {
        throw new Error("Quiz question does not exist.");
      }

      const answer = validateQuizAnswer(question, payload.answer);

      if (answer < 0) {
        throw new Error("A question check requires a selected answer.");
      }

      return Response.json({
        questionId: question.stableId,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        correct: answer === question.answerIndex,
      });
    }

    if (payload.action === "submit") {
      if (typeof payload.submissionId !== "string" || !Array.isArray(payload.answers)) {
        throw new Error("Submission ID and answers are required.");
      }

      if (!payload.answers.every((answer) => typeof answer === "number")) {
        throw new Error("Quiz answers must be numeric indexes.");
      }

      const submissionId = normalizeQuizSubmissionId(payload.submissionId);
      const grading = gradeQuizAnswers(authoritative.questions, payload.answers as number[]);

      return Response.json({
        attemptId: `local:${submissionId}`,
        quizId: authoritative.quiz.id,
        quizTitle: authoritative.quiz.title,
        score: grading.score,
        totalQuestions: grading.totalQuestions,
        percentage: grading.percentage,
        completedAt: Date.now(),
        answers: grading.answers,
        questionResults: grading.questionResults,
      });
    }

    throw new Error("Unsupported quiz grading action.");
  } catch (error) {
    return errorResponse(error);
  }
}
