"use client";

import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import {
  QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT,
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

export function LocalQuizPerformance() {
  const catalog = useLearnerCatalog();
  const [summary, setSummary] = useState<QuizAttemptHistorySummary>(emptySummary);

  useEffect(() => {
    function syncSummary() {
      setSummary(summarizeQuizAttemptHistory(readQuizAttemptHistory()));
    }

    syncSummary();
    window.addEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncSummary);
    window.addEventListener("storage", syncSummary);

    return () => {
      window.removeEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncSummary);
      window.removeEventListener("storage", syncSummary);
    };
  }, []);

  const rows = [
    ...catalog.quizzes.map((quiz) => ({
      quizId: quiz.id,
      quizTitle: quiz.title,
      attempt: summary.latestByQuizId[quiz.id],
    })),
    ...Object.values(summary.latestByQuizId)
      .filter((attempt) => !catalog.quizById.has(attempt.quizId))
      .map((attempt) => ({
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle,
        attempt,
      })),
  ];

  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader>
        <CardTitle>Quiz performance</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.length > 0 ? (
          rows.map(({ quizId, quizTitle, attempt }) => (
            <div
              key={quizId}
              className={`bg-secondary/40 flex items-center justify-between gap-4 rounded-lg p-4 ${clickableGlassCardClassName}`}
            >
              <div>
                <p className="text-sm font-medium">{quizTitle}</p>
                {attempt ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {attempt.score} of {attempt.totalQuestions} correct
                  </p>
                ) : null}
              </div>
              <span className={attempt ? "font-semibold" : "text-muted-foreground text-sm"}>
                {attempt ? `${attempt.percentage}%` : "No attempt yet"}
              </span>
            </div>
          ))
        ) : (
          <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
            Quiz scores will appear after knowledge checks are available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}


