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
import { readQuizAttemptHistory, writeQuizAttemptHistory } from "@/lib/quiz-attempt-history";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { CheckCircle2Icon, CircleIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SecureQuizSurface = "web" | "mobile";

type SecureQuizPlayerProps = {
  quiz: Quiz;
  surface?: SecureQuizSurface;
};

type QuizQuestionFeedback = {
  questionId: string;
  answerIndex: number;
  explanation: string;
  correct: boolean;
};

type AuthoritativeQuizAttemptResult = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: number;
  answers: number[];
  questionResults: QuizQuestionFeedback[];
};

type SecureQuizResults = AuthoritativeQuizAttemptResult & {
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

function createSubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function postLocalQuizGrading<TResult>(body: Record<string, unknown>): Promise<TResult> {
  const response = await fetch("/api/quiz-grading", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { error?: unknown } & TResult;

  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Unable to grade this quiz request.");
  }

  return payload;
}

export function SecureQuizPlayer({ quiz, surface = "web" }: SecureQuizPlayerProps) {
  if (!convexEnv.isConfigured) {
    return <LocalServerSecureQuizPlayer quiz={quiz} surface={surface} />;
  }

  return <ConvexSecureQuizPlayer quiz={quiz} surface={surface} />;
}

function LocalServerSecureQuizPlayer({ quiz, surface = "web" }: SecureQuizPlayerProps) {
  return (
    <SecureQuizPlayerCore
      quiz={quiz}
      surface={surface}
      onCheckAnswer={async (questionId, answer) =>
        await postLocalQuizGrading<QuizQuestionFeedback>({
          action: "check",
          quizId: quiz.id,
          questionId,
          answer,
        })
      }
      onComplete={async (answers, submissionId) =>
        await postLocalQuizGrading<AuthoritativeQuizAttemptResult>({
          action: "submit",
          quizId: quiz.id,
          submissionId,
          answers,
        })
      }
    />
  );
}

function ConvexSecureQuizPlayer({ quiz, surface = "web" }: SecureQuizPlayerProps) {
  const checkAnswer = useMutation(convexApi.quizzes.checkQuizAnswer);
  const submitAttempt = useMutation(convexApi.quizzes.submitQuizAttempt);
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  const getIdentityArgs = useCallback(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    const identityArgs = getCurrentConvexLearnerArgs(isAuthenticated);

    if (!identityArgs) {
      throw new Error("Your learner session is not ready for secure quiz grading yet.");
    }

    return identityArgs;
  }, [isLoaded, isSignedIn, userId]);

  return (
    <SecureQuizPlayerCore
      quiz={quiz}
      surface={surface}
      onCheckAnswer={async (questionId, answer) => {
        return (await checkAnswer({
          ...getIdentityArgs(),
          quizId: quiz.id,
          questionId,
          answer,
        })) as QuizQuestionFeedback;
      }}
      onComplete={async (answers, submissionId) => {
        return (await submitAttempt({
          ...getIdentityArgs(),
          quizId: quiz.id,
          submissionId,
          answers,
        })) as AuthoritativeQuizAttemptResult;
      }}
    />
  );
}

type SecureQuizPlayerCoreProps = {
  quiz: Quiz;
  surface: SecureQuizSurface;
  onCheckAnswer: (questionId: string, answer: number) => Promise<QuizQuestionFeedback>;
  onComplete: (answers: number[], submissionId: string) => Promise<AuthoritativeQuizAttemptResult>;
};

function SecureQuizPlayerCore({ quiz, surface, onCheckAnswer, onComplete }: SecureQuizPlayerCoreProps) {
  const initialTimeInSeconds = useMemo(() => parseEstimatedTimeInSeconds(quiz.estimatedTime), [quiz.estimatedTime]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<QuizQuestionFeedback | null>(null);
  const [results, setResults] = useState<SecureQuizResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [checking, setChecking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submissionIdRef = useRef(createSubmissionId());
  const completionGuardRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldFocusQuestionRef = useRef(false);
  const hasQuestions = quiz.questions.length > 0;
  const question = quiz.questions[currentIndex];
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
    async (nextAnswers: number[], timedOut = false) => {
      if (results || !hasQuestions || completionGuardRef.current) return;

      completionGuardRef.current = true;
      setCompleting(true);
      setErrorMessage(null);
      const finalAnswers = quiz.questions.map((_, index) => nextAnswers[index] ?? -1);

      try {
        const authoritativeResult = await onComplete(finalAnswers, submissionIdRef.current);
        const historyItem = {
          quizId: authoritativeResult.quizId,
          quizTitle: authoritativeResult.quizTitle,
          score: authoritativeResult.score,
          totalQuestions: authoritativeResult.totalQuestions,
          percentage: authoritativeResult.percentage,
          completedAt: new Date(authoritativeResult.completedAt).toISOString(),
        };

        writeQuizAttemptHistory([historyItem, ...readQuizAttemptHistory()]);
        setResults({ ...authoritativeResult, timedOut });
      } catch (error) {
        completionGuardRef.current = false;
        setErrorMessage(error instanceof Error ? error.message : "Unable to save this quiz attempt.");
      } finally {
        setCompleting(false);
      }
    },
    [hasQuestions, onComplete, quiz.questions, results],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setFeedback(null);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
    setChecking(false);
    setCompleting(false);
    setErrorMessage(null);
    submissionIdRef.current = createSubmissionId();
    completionGuardRef.current = false;
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
    if (!hasQuestions || timeLeft !== 0 || results || completing) return;

    const timedAnswers = [...answers];

    if (submitted && selectedIndex !== null) {
      timedAnswers[currentIndex] = selectedIndex;
    }

    void completeQuiz(timedAnswers, true);
  }, [answers, completeQuiz, completing, currentIndex, hasQuestions, results, selectedIndex, submitted, timeLeft]);

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

  async function submitAnswer() {
    if (!question || selectedIndex === null || checking || completing) return;

    setChecking(true);
    setErrorMessage(null);

    try {
      const checked = await onCheckAnswer(question.id, selectedIndex);
      setFeedback(checked);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to check this answer.");
    } finally {
      setChecking(false);
    }
  }

  function nextQuestion() {
    if (selectedIndex === null || !submitted || checking || completing) return;

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selectedIndex;
    setAnswers(nextAnswers);

    if (currentIndex === quiz.questions.length - 1) {
      void completeQuiz(nextAnswers);
      return;
    }

    if (surface === "web") {
      shouldFocusQuestionRef.current = true;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedIndex(null);
    setSubmitted(false);
    setFeedback(null);
    setErrorMessage(null);
  }

  function restartQuiz() {
    if (surface === "web") {
      shouldFocusQuestionRef.current = true;
    }

    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers([]);
    setFeedback(null);
    setResults(null);
    setTimeLeft(initialTimeInSeconds);
    setChecking(false);
    setCompleting(false);
    setErrorMessage(null);
    submissionIdRef.current = createSubmissionId();
    completionGuardRef.current = false;
  }

  function selectChoice(index: number) {
    if (!submitted && !checking && !completing) {
      setSelectedIndex(index);
    }
  }

  function handleChoiceKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (surface !== "web" || submitted || checking || completing || !question) return;

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
    const nextStep = surface === "mobile" ? "choosing your next quiz" : "returning to your course";

    return (
      <Card className={`rounded-lg ${elevatedGlassCardClassName}`}>
        <CardHeader>
          <p className="text-muted-foreground text-sm">Final results</p>
          <h2 ref={resultsHeadingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
            {results.percentage}% score
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-6">
            {results.timedOut ? "Time expired. " : ""}
            You answered {results.score} of {results.totalQuestions} questions correctly. Review each explanation below
            before {nextStep}.
          </p>
          <div className="grid gap-4">
            {quiz.questions.map((item, index) => {
              const answer = results.answers[index];
              const result = results.questionResults.find((entry) => entry.questionId === item.id);
              const answered = answer >= 0;
              const correct = Boolean(result?.correct);

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
                    {result ? (
                      <p>
                        <span className="text-muted-foreground">Correct answer:</span>{" "}
                        {item.choices[result.answerIndex]}
                      </p>
                    ) : null}
                  </div>
                  {result?.explanation ? (
                    <p className="text-muted-foreground mt-2 text-sm leading-6">{result.explanation}</p>
                  ) : null}
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
            const correct = submitted && feedback?.answerIndex === index;
            const incorrect = submitted && selected && feedback?.answerIndex !== index;
            const webRadioProps =
              surface === "web"
                ? {
                    role: "radio" as const,
                    "aria-checked": selected,
                    "aria-disabled": submitted || checking || completing || undefined,
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

        {submitted && feedback ? (
          <div className="bg-secondary/60 rounded-lg p-4 text-sm leading-6" aria-live="polite">
            <p className="font-semibold">{feedback.correct ? "Correct" : "Not quite yet"}</p>
            {feedback.explanation ? <p className="text-muted-foreground mt-1">{feedback.explanation}</p> : null}
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!submitted ? (
            <Button
              className="min-h-12 w-full sm:w-auto"
              disabled={selectedIndex === null || checking || completing}
              onClick={() => void submitAnswer()}
            >
              {checking ? "Checking..." : "Submit answer"}
            </Button>
          ) : (
            <Button className="min-h-12 w-full sm:w-auto" disabled={completing} onClick={nextQuestion}>
              {completing
                ? "Saving result..."
                : currentIndex === quiz.questions.length - 1
                  ? "See results"
                  : "Next question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
