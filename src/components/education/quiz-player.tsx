"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { ProgressBar } from "@/components/education/progress-bar";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { saveQuizAttemptHistoryItem, type QuizAttemptHistoryItem } from "@/lib/quiz-attempt-history";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { CheckCircle2Icon, CircleIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type QuizSurface = "web" | "mobile";

type QuizPlayerProps = {
  quiz: Quiz;
  surface?: QuizSurface;
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

export function QuizPlayer({ quiz, surface = "web" }: QuizPlayerProps) {
  if (!convexEnv.isConfigured) {
    return <QuizPlayerCore quiz={quiz} surface={surface} />;
  }

  return <ConvexQuizPlayer quiz={quiz} surface={surface} />;
}

function ConvexQuizPlayer({ quiz, surface = "web" }: QuizPlayerProps) {
  const saveAttempt = useMutation(convexApi.quizzes.submitQuizAttempt);
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  return (
    <QuizPlayerCore
      quiz={quiz}
      surface={surface}
      onComplete={(answers, score, attempt) => {
        const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
        const identityArgs = getCurrentConvexLearnerArgs(isAuthenticated);

        if (!identityArgs) {
          return;
        }

        saveAttempt({
          ...identityArgs,
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

type QuizPlayerCoreProps = {
  quiz: Quiz;
  surface: QuizSurface;
  onComplete?: (answers: number[], score: number, attempt: QuizAttemptHistoryItem) => void;
};

function QuizPlayerCore({ quiz, surface, onComplete }: QuizPlayerCoreProps) {
  const initialTimeInSeconds = useMemo(() => parseEstimatedTimeInSeconds(quiz.estimatedTime), [quiz.estimatedTime]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldFocusQuestionRef = useRef(false);
  const hasQuestions = quiz.questions.length > 0;
  const question = quiz.questions[currentIndex];
  const isCorrect = Boolean(question && submitted && selectedIndex === question.answerIndex);
  const progress = hasQuestions ? ((currentIndex + (results ? 1 : 0)) / quiz.questions.length) * 100 : 0;
  const questionHeadingId = question ? `quiz-${quiz.id}-question-${question.id}` : undefined;
  const timerAnnouncement =
    surface === "web"
      ? timeLeft === 60
        ? "One minute remaining"
        : timeLeft === 10
          ? "Ten seconds remaining"
          : ""
      : "";

  const completeQuiz = useCallback(
    (nextAnswers: number[], timedOut = false) => {
      if (results || !hasQuestions) return;

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
    [hasQuestions, onComplete, quiz.id, quiz.questions, quiz.title, results],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
    shouldFocusQuestionRef.current = false;
  }, [initialTimeInSeconds, quiz.id]);

  useEffect(() => {
    if (!hasQuestions || results) return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasQuestions, results]);

  useEffect(() => {
    if (!hasQuestions || timeLeft !== 0 || results) return;

    const timedAnswers = [...answers];

    if (submitted && selectedIndex !== null) {
      timedAnswers[currentIndex] = selectedIndex;
    }

    completeQuiz(timedAnswers, true);
  }, [answers, completeQuiz, currentIndex, hasQuestions, results, selectedIndex, submitted, timeLeft]);

  useEffect(() => {
    if (surface !== "web" || results || !shouldFocusQuestionRef.current) return;

    shouldFocusQuestionRef.current = false;
    const frame = window.requestAnimationFrame(() => questionHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [currentIndex, results, surface]);

  useEffect(() => {
    if (surface !== "web" || !results) return;

    const frame = window.requestAnimationFrame(() => resultsHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [results, surface]);

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

    if (surface === "web") {
      shouldFocusQuestionRef.current = true;
    }
    setCurrentIndex((value) => value + 1);
    setSelectedIndex(null);
    setSubmitted(false);
  }

  function restartQuiz() {
    if (surface === "web") {
      shouldFocusQuestionRef.current = true;
    }
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
  }

  function selectChoice(index: number) {
    if (!submitted) setSelectedIndex(index);
  }

  function handleChoiceKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (surface !== "web" || submitted || !question) return;

    const lastIndex = question.choices.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    setSelectedIndex(nextIndex);
    window.requestAnimationFrame(() => choiceRefs.current[nextIndex]?.focus());
  }

  if (!question) {
    return (
      <Card className={`rounded-lg ${elevatedGlassCardClassName}`}>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">No questions available yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-6">
            This quiz is not ready for practice. Choose another quiz and try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (results) {
    const percent = Math.round((results.score / quiz.questions.length) * 100);
    const nextStep = surface === "mobile" ? "choosing your next quiz" : "returning to your course";

    return (
      <Card className={`rounded-lg ${elevatedGlassCardClassName}`}>
        <CardHeader>
          <p className="text-muted-foreground text-sm">Final results</p>
          <h2 ref={resultsHeadingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
            {percent}% score
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-6">
            {results.timedOut ? "Time expired. " : ""}
            You answered {results.score} of {quiz.questions.length} questions correctly. Review each explanation below
            before {nextStep}.
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
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
            <span>
              Question {currentIndex + 1} of {quiz.questions.length}
            </span>
            <span
              {...(surface === "mobile" ? { "aria-live": "polite" as const } : {})}
              className={cn("shrink-0 font-medium", timeLeft <= 60 && "text-destructive")}
            >
              Time left: {formatQuizTime(timeLeft)}
            </span>
            {surface === "web" ? (
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {timerAnnouncement}
              </span>
            ) : null}
          </div>
          <ProgressBar value={progress} />
        </div>
        <h2
          id={questionHeadingId}
          ref={questionHeadingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          {question.prompt}
        </h2>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className="grid gap-3"
          {...(surface === "web" ? { role: "radiogroup", "aria-labelledby": questionHeadingId } : {})}
        >
          {question.choices.map((choice, index) => {
            const selected = selectedIndex === index;
            const correct = submitted && index === question.answerIndex;
            const incorrect = submitted && selected && index !== question.answerIndex;
            const webRadioProps =
              surface === "web"
                ? {
                    role: "radio" as const,
                    "aria-checked": selected,
                    "aria-disabled": submitted || undefined,
                    tabIndex: selectedIndex === null ? (index === 0 ? 0 : -1) : selected ? 0 : -1,
                  }
                : {};

            return (
              <button
                key={choice}
                ref={(element) => {
                  choiceRefs.current[index] = element;
                }}
                type="button"
                onClick={() => selectChoice(index)}
                onKeyDown={(event) => handleChoiceKeyDown(event, index)}
                {...webRadioProps}
                className={cn(
                  "flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-lg border bg-white/70 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/70",
                  selected && "border-primary bg-secondary/70",
                  correct && "border-success bg-success/10",
                  incorrect && "border-destructive bg-destructive/10",
                )}
              >
                {correct ? (
                  <CheckCircle2Icon className="text-success size-5 shrink-0" />
                ) : incorrect ? (
                  <XCircleIcon className="text-destructive size-5 shrink-0" />
                ) : (
                  <CircleIcon className="text-muted-foreground size-5 shrink-0" />
                )}
                <span className="min-w-0">{choice}</span>
              </button>
            );
          })}
        </div>
        {submitted && (
          <div className="bg-secondary/60 rounded-lg p-4 text-sm leading-6" aria-live="polite">
            <p className="font-semibold">{isCorrect ? "Correct" : "Not quite yet"}</p>
            <p className="text-muted-foreground mt-1">{question.explanation}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          {!submitted ? (
            <Button className="min-h-12 w-full sm:w-auto" disabled={selectedIndex === null} onClick={submitAnswer}>
              Submit answer
            </Button>
          ) : (
            <Button className="min-h-12 w-full sm:w-auto" onClick={nextQuestion}>
              {currentIndex === quiz.questions.length - 1 ? "See results" : "Next question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
