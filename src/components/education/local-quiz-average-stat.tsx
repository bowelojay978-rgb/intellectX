"use client";

import {
  readQuizAttemptHistory,
  summarizeQuizAttemptHistory,
  type QuizAttemptHistorySummary,
} from "@/lib/quiz-attempt-history";
import { useEffect, useState } from "react";

const emptySummary: QuizAttemptHistorySummary = {
  attemptCount: 0,
  averagePercentage: 0,
  latestByQuizId: {},
};

export function LocalQuizAverageStat() {
  const [summary, setSummary] = useState<QuizAttemptHistorySummary>(emptySummary);

  useEffect(() => {
    setSummary(summarizeQuizAttemptHistory(readQuizAttemptHistory()));
  }, []);

  if (summary.attemptCount === 0) {
    return (
      <>
        <p className="text-3xl font-semibold tracking-tight">Sync pending</p>
        <p className="text-muted-foreground text-sm">Average quiz performance</p>
      </>
    );
  }

  return (
    <>
      <p className="text-3xl font-semibold tracking-tight">{summary.averagePercentage}%</p>
      <p className="text-muted-foreground text-sm">
        Average quiz performance from {summary.attemptCount} local attempt{summary.attemptCount === 1 ? "" : "s"}
      </p>
    </>
  );
}
