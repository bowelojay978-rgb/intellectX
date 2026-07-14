import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { quizzes } from "@/data/quizzes";
import {
  gradeQuizAnswers,
  normalizeQuizSubmissionId,
  toLearnerQuizQuestionPayload,
} from "../../convex/lib/quizIntegrity";

const questions = [
  {
    stableId: "q1",
    prompt: "First?",
    choices: ["A", "B"],
    answerIndex: 1,
    explanation: "B is correct.",
    order: 1,
  },
  {
    stableId: "q2",
    prompt: "Second?",
    choices: ["A", "B", "C"],
    answerIndex: 0,
    explanation: "A is correct.",
    order: 2,
  },
];

describe("quiz server authority", () => {
  it("removes answer keys and explanations from pre-submission learner question payloads", () => {
    const payload = toLearnerQuizQuestionPayload(questions[0]);

    expect(payload).toEqual({
      stableId: "q1",
      prompt: "First?",
      choices: ["A", "B"],
      order: 1,
    });
    expect(payload).not.toHaveProperty("answerIndex");
    expect(payload).not.toHaveProperty("explanation");
  });

  it("calculates score, percentage, and post-submission feedback from authoritative questions", () => {
    expect(gradeQuizAnswers(questions, [1, 2])).toEqual({
      answers: [1, 2],
      score: 1,
      totalQuestions: 2,
      percentage: 50,
      questionResults: [
        {
          questionId: "q1",
          answerIndex: 1,
          explanation: "B is correct.",
          correct: true,
        },
        {
          questionId: "q2",
          answerIndex: 0,
          explanation: "A is correct.",
          correct: false,
        },
      ],
    });
  });

  it("accepts unanswered timeout sentinels but rejects malformed answer counts and ranges", () => {
    expect(gradeQuizAnswers(questions, [-1, 0]).score).toBe(1);
    expect(() => gradeQuizAnswers(questions, [1])).toThrow("Expected 2 quiz answers but received 1");
    expect(() => gradeQuizAnswers(questions, [2, 0])).toThrow("q1 is out of range");
    expect(() => gradeQuizAnswers(questions, [1.5, 0])).toThrow("q1 must be an integer");
  });

  it("requires bounded non-empty idempotency keys", () => {
    expect(normalizeQuizSubmissionId(" submission-1 ")).toBe("submission-1");
    expect(() => normalizeQuizSubmissionId("   ")).toThrow("submission ID is required");
    expect(() => normalizeQuizSubmissionId("x".repeat(129))).toThrow("at most 128 characters");
  });

  it("keeps real answer keys out of public fallback quiz data", () => {
    for (const quiz of quizzes) {
      for (const question of quiz.questions) {
        expect(question.answerIndex).toBe(-1);
        expect(question.explanation).toBe("");
      }
    }
  });

  it("wires server scoring, access validation, idempotency, and trusted attempt metadata", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/quizzes.ts"), "utf8");

    expect(source).toContain("toLearnerQuizQuestionPayload");
    expect(source).toContain("getAccessibleQuiz");
    expect(source).toContain("gradeQuizAnswers");
    expect(source).toContain('withIndex("by_user_submission_id"');
    expect(source).toContain("const completedAt = Date.now()");
    expect(source).toContain("quizTitle: accessible.quiz.title");
    expect(source).not.toContain("score: args.score");
    expect(source).not.toContain("totalQuestions: args.totalQuestions");
    expect(source).not.toContain("quizTitle: args.quizTitle");
    expect(source).not.toContain("percentage: args.percentage");
    expect(source).not.toContain("completedAt: args.completedAt");
  });

  it("routes both web and protected native-mobile quiz surfaces through the secure player", () => {
    const pageSource = readFileSync(path.resolve(process.cwd(), "src/components/education/quiz-page-content.tsx"), "utf8");
    const playerSource = readFileSync(
      path.resolve(process.cwd(), "src/components/education/secure-quiz-player.tsx"),
      "utf8",
    );

    expect(pageSource).toContain('import { SecureQuizPlayer } from "@/components/education/secure-quiz-player"');
    expect(pageSource).toContain('<SecureQuizPlayer quiz={quiz} surface={mobileSurface ? "mobile" : "web"} />');
    expect(playerSource).toContain("convexApi.quizzes.checkQuizAnswer");
    expect(playerSource).toContain("convexApi.quizzes.submitQuizAttempt");
    expect(playerSource).not.toContain("question.answerIndex");
  });
});
