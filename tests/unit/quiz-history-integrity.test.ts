import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import {
  readQuizAttemptHistory,
  writeQuizAttemptHistory,
  type QuizAttemptHistoryItem,
} from "@/lib/quiz-attempt-history";
import { summarizeStudyActivity } from "@/lib/study-activity-summary";

beforeEach(() => {
  localStorage.clear();
});

function buildDailyQuizAttempts(dayCount: number, now: Date): QuizAttemptHistoryItem[] {
  return Array.from({ length: dayCount }, (_, index) => {
    const completedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index, 12, 0, 0);

    return {
      quizId: `quiz-${index + 1}`,
      quizTitle: `Quiz ${index + 1}`,
      score: 1,
      totalQuestions: 1,
      percentage: 100,
      completedAt: completedAt.toISOString(),
    };
  });
}

describe("quiz attempt history integrity", () => {
  it("preserves complete quiz history beyond the previous 20-attempt cache limit", () => {
    const now = new Date(2026, 6, 13, 12, 0, 0);
    const attempts = buildDailyQuizAttempts(30, now);

    writeQuizAttemptHistory(attempts);

    expect(readQuizAttemptHistory()).toHaveLength(30);
  });

  it("keeps quiz-only study streak calculation correct beyond 20 consecutive days", () => {
    const now = new Date(2026, 6, 13, 12, 0, 0);
    const attempts = buildDailyQuizAttempts(30, now);

    writeQuizAttemptHistory(attempts);

    const summary = summarizeStudyActivity([], readQuizAttemptHistory(), now);
    expect(summary.activeDateCount).toBe(30);
    expect(summary.currentStreak).toBe(30);
    expect(summary.longestStreak).toBe(30);
  });

  it("does not truncate authenticated quiz history at the Convex hydration boundary", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/quizzes.ts"), "utf8");

    expect(source).not.toContain(".slice(0, 20)");
  });
});
