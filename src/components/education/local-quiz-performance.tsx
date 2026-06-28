"use client";

import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizzes } from "@/data/quizzes";
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

export function LocalQuizPerformance() {
  const [summary, setSummary] = useState<QuizAttemptHistorySummary>(emptySummary);

  useEffect(() => {
    setSummary(summarizeQuizAttemptHistory(readQuizAttemptHistory()));
  }, []);

  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader>
        <CardTitle>Quiz performance</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => {
            const attempt = summary.latestByQuizId[quiz.id];

            return (
              <div
                key={quiz.id}
                className={`bg-secondary/40 flex items-center justify-between gap-4 rounded-lg p-4 ${clickableGlassCardClassName}`}
              >
                <div>
                  <p className="text-sm font-medium">{quiz.title}</p>
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
            );
          })
        ) : (
          <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
            Quiz scores will appear after knowledge checks are available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

