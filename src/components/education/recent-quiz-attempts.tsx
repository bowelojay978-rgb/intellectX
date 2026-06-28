"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readQuizAttemptHistory, type QuizAttemptHistoryItem } from "@/lib/quiz-attempt-history";
import { TrophyIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatCompletedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentQuizAttempts() {
  const [attempts, setAttempts] = useState<QuizAttemptHistoryItem[]>([]);

  useEffect(() => {
    setAttempts(readQuizAttemptHistory().slice(0, 3));
  }, []);

  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="size-5" />
          Recent quiz attempts
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {attempts.length > 0 ? (
          attempts.map((attempt) => (
            <div key={`${attempt.quizId}-${attempt.completedAt}`} className="bg-secondary/40 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{attempt.quizTitle}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{formatCompletedAt(attempt.completedAt)}</p>
                </div>
                <p className="text-xl font-semibold tracking-tight">{attempt.percentage}%</p>
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                {attempt.score} of {attempt.totalQuestions} correct
              </p>
            </div>
          ))
        ) : (
          <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
            <p>No local quiz attempts yet. Start a quiz to build your recent results history.</p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/mobile-quizzes">Start a quiz</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

