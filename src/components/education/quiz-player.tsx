"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { ProgressBar } from "@/components/education/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerIdentity } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { saveQuizAttemptHistoryItem, type QuizAttemptHistoryItem } from "@/lib/quiz-attempt-history";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { CheckCircle2Icon, CircleIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type QuizPlayerProps = {
  quiz: Quiz;
};

type QuizResults = {
  answers: number[];
  score: number;
  timedOut?: boolean;
};

function parseEstimatedTimeInSeconds(value: string) {
  const minutes = value.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minute|minutes)/i);

  if (minutes) {
    return Math.max(1, Math.round(Number(minutes[1]) * 60));
  }

  const seconds = value.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|second|seconds)/i);

  if (seconds) {
    return Math.max(1, Math.round(Number(seconds[1])));
  }

  return 5 * 60;
}

function formatQuizTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
  if (!convexEnv.isConfigured) {
    return <QuizPlayerCore quiz={quiz} />;
  }

  return <ConvexQuizPlayer quiz={quiz} />;
}

function ConvexQuizPlayer({ quiz }: QuizPlayerProps) {
  const saveAttempt = useMutation(convexApi.quizzes.submitQuizAttempt);

  return (
    <QuizPlayerCore
      quiz={quiz}
      onComplete={(answers, score, attempt) => {
        const identity = getCurrentConvexLearnerIdentity();

        if (!identity) {
          return;
        }

        saveAttempt({
          userKey: identity.userKey,
          quizId: quiz.id,
          score,
          totalQuestions: quiz.questions.length,
          answers,
          quizTitle: attempt.quizTitle,
          percentage: attempt.percentage,
          completedAt: new Date(attempt.completedAt).getTime(),
        }).catch((error) => {
          console.warn("Unable to sync quiz attempt to Convex", error);
        });
      }}
    />
  );
}

type QuizPlayerCoreProps = QuizPlayerProps & {
  onComplete?: (answers: number[], score: number, attempt: QuizAttemptHistoryItem) => void;
};

function QuizPlayerCore({ quiz, onComplete }: QuizPlayerCoreProps) {
  const initialTimeInSeconds = useMemo(() => parseEstimatedTimeInSeconds(quiz.estimatedTime), [quiz.estimatedTime]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);

  const question = quiz.questions[currentIndex];
  const isCorrect = submitted && selectedIndex === question.answerIndex;
  const progress = ((currentIndex + (results ? 1 : 0)) / quiz.questions.length) * 100;

  const completeQuiz = useCallback(
    (nextAnswers: number[], timedOut = false) => {
      if (results) return;

      const finalAnswers = quiz.questions.map((_, index) => nextAnswers[index] ?? -1);
      const finalScore = finalAnswers.reduce(
        (total, answer, index) => total + (answer === quiz.questions[index].answerIndex ? 1 : 0),
        0,
      );

      const attempt = saveQuizAttemptHistoryItem({
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: finalScore,
        totalQuestions: quiz.questions.length,
      });
      onComplete?.(finalAnswers, finalScore, attempt);
      setResults({ answers: finalAnswers, score: finalScore, timedOut });
    },
    [onComplete, quiz.id, quiz.questions, quiz.title, results],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
  }, [initialTimeInSeconds, quiz.id]);

  useEffect(() => {
    if (results) return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [results]);

  useEffect(() => {
    if (timeLeft !== 0 || results) return;

    const timedAnswers = [...answers];

    if (submitted && selectedIndex !== null) {
      timedAnswers[currentIndex] = selectedIndex;
    }

    completeQuiz(timedAnswers, true);
  }, [answers, completeQuiz, currentIndex, results, selectedIndex, submitted, timeLeft]);

  function submitAnswer() {
    if (selectedIndex === null) return;
    setSubmitted(true);
  }

  function nextQuestion() {
    if (selectedIndex === null) return;

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selectedIndex;
    setAnswers(nextAnswers);

    if (currentIndex === quiz.questions.length - 1) {
      completeQuiz(nextAnswers);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedIndex(null);
    setSubmitted(false);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
  }

  if (results) {
    const percent = Math.round((results.score / quiz.questions.length) * 100);

    return (
      <Card className={`rounded-lg ${elevatedGlassCardClassName}`}>
        <CardHeader>
          <p className="text-muted-foreground text-sm">Final results</p>
          <CardTitle className="text-3xl tracking-tight">{percent}% score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-6">
            {results.timedOut ? "Time expired. " : ""}
            You answered {results.score} of {quiz.questions.length} questions correctly. Review each explanation below
            before returning to your course.
          </p>
          <div className="grid gap-4">
            {quiz.questions.map((item, index) => {
              const answer = results.answers[index];
              const answered = answer >= 0;
              const correct = answer === item.answerIndex;

              return (
                <div key={item.id} className="bg-secondary/40 rounded-lg p-4">
                  <p className="font-medium">{item.prompt}</p>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className={cn(correct ? "text-success" : "text-destructive")}>
                      {correct ? "Correct" : "Not quite"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Your answer:</span>{" "}
                      {answered ? item.choices[answer] : "No answer selected"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Correct answer:</span> {item.choices[item.answerIndex]}
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{item.explanation}</p>
                </div>
              );
            })}
          </div>
          <Button onClick={restartQuiz} variant="outline">
            <RotateCcwIcon />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-lg ${elevatedGlassCardClassName}`}>
      <CardHeader>
        <div className="mb-2 space-y-2">
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              Question {currentIndex + 1} of {quiz.questions.length}
            </span>
            <span
              aria-live="polite"
              className={cn("font-medium", timeLeft <= 60 && "text-destructive")}
            >
              Time left: {formatQuizTime(timeLeft)}
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>
        <CardTitle className="text-2xl tracking-tight">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3">
          {question.choices.map((choice, index) => {
            const selected = selectedIndex === index;
            const correct = submitted && index === question.answerIndex;
            const incorrect = submitted && selected && index !== question.answerIndex;

            return (
              <button
                key={choice}
                type="button"
                onClick={() => {
                  if (!submitted) setSelectedIndex(index);
                }}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-lg border bg-white/70 px-4 py-3 text-left text-sm transition-colors dark:bg-card/70",
                  selected && "border-primary bg-secondary/70",
                  correct && "border-success bg-success/10",
                  incorrect && "border-destructive bg-destructive/10",
                )}
              >
                {correct ? (
                  <CheckCircle2Icon className="text-success size-5" />
                ) : incorrect ? (
                  <XCircleIcon className="text-destructive size-5" />
                ) : (
                  <CircleIcon className="text-muted-foreground size-5" />
                )}
                <span>{choice}</span>
              </button>
            );
          })}
        </div>
        {submitted && (
          <div className="bg-secondary/60 rounded-lg p-4 text-sm leading-6">
            <p className="font-semibold">{isCorrect ? "Correct" : "Not quite yet"}</p>
            <p className="text-muted-foreground mt-1">{question.explanation}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          {!submitted ? (
            <Button disabled={selectedIndex === null} onClick={submitAnswer}>
              Submit answer
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              {currentIndex === quiz.questions.length - 1 ? "See results" : "Next question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


