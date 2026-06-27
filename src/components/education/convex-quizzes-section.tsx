"use client";

import { DataSourceBadge } from "@/components/education/data-source-badge";
import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import { lessons } from "@/data/lessons";
import type { Quiz } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { ClockIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";

type ConvexQuiz = {
  stableId: string;
  courseStableId: string;
  lessonStableId?: string;
  title: string;
  difficulty: Quiz["difficulty"];
  estimatedTime: string;
  questions: unknown[];
};

type ConvexQuizzesSectionProps = {
  fallbackQuizzes: Quiz[];
};

type StoredQuizAttempt = {
  answers?: number[];
  score?: number;
  totalQuestions?: number;
  completedAt?: string;
};

type QuizAttemptSummary = {
  completed: boolean;
  percent?: number;
};

function getStoredAttempt(quizId: string): QuizAttemptSummary {
  try {
    const storedValue = window.localStorage.getItem(`intellectx:quiz-attempt:${quizId}`);

    if (!storedValue) {
      return { completed: false };
    }

    const attempt = JSON.parse(storedValue) as StoredQuizAttempt;
    const score = attempt.score;
    const totalQuestions = attempt.totalQuestions;
    const hasScore = typeof score === "number" && typeof totalQuestions === "number";

    return {
      completed: true,
      percent: hasScore ? Math.round((score / totalQuestions) * 100) : undefined,
    };
  } catch {
    return { completed: false };
  }
}

function normalizeQuiz(quiz: ConvexQuiz, fallbackQuizzes: Quiz[]): Quiz | null {
  const fallbackQuiz = fallbackQuizzes.find((item) => item.id === quiz.stableId);

  if (!fallbackQuiz) {
    return null;
  }

  return {
    id: quiz.stableId,
    courseId: quiz.courseStableId,
    lessonId: quiz.lessonStableId,
    title: quiz.title,
    difficulty: quiz.difficulty,
    estimatedTime: quiz.estimatedTime,
    questions: fallbackQuiz.questions,
  };
}

function QuizGrid({ quizzes }: { quizzes: Quiz[] }) {
  const [localAttempts, setLocalAttempts] = useState<Record<string, QuizAttemptSummary>>({});

  useEffect(() => {
    setLocalAttempts(Object.fromEntries(quizzes.map((quiz) => [quiz.id, getStoredAttempt(quiz.id)])));
  }, [quizzes]);

  return (
    <>
      <div className="mb-4 flex justify-center">
        <DataSourceBadge />
      </div>
      <section className="grid gap-5 md:grid-cols-3">
        {quizzes.map((quiz) => {
          const course = courses.find((item) => item.id === quiz.courseId);
          const lesson = lessons.find((item) => item.id === quiz.lessonId);
          const localAttempt = localAttempts[quiz.id];
          const score = localAttempt?.percent;
          const hasScore = typeof score === "number";
          const status = localAttempt?.completed ? "Completed" : "Not started";

          return (
            <Link key={quiz.id} href={`/quiz/${quiz.id}`} className="block">
              <Card className={`animate-widget rounded-lg ${glassCardClassName}`}>
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    {status}
                  </Badge>
                  <CardTitle className="text-xl tracking-tight">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground leading-6">
                    {course?.title ?? quiz.courseId}
                    {lesson ? ` / ${lesson.title}` : ""}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1">
                      <FileQuestionIcon className="size-4" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-4" />
                      {quiz.estimatedTime}
                    </span>
                  </div>
                  <p>
                    <span className="text-muted-foreground">Difficulty:</span> {quiz.difficulty}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last score:</span>{" "}
                    {hasScore ? `${score}%` : "No attempt yet"}
                  </p>
                </CardContent>
                <CardFooter>
                  <span className={buttonVariants({ className: "w-full" })}>{hasScore ? "Review quiz" : "Start quiz"}</span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </section>
    </>
  );
}

function LiveQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  const quizzes = useQuery(convexApi.quizzes.listQuizzes, {});

  if (!quizzes) {
    return <QuizGrid quizzes={fallbackQuizzes} />;
  }

  const playableQuizzes = (quizzes as ConvexQuiz[])
    .map((quiz) => normalizeQuiz(quiz, fallbackQuizzes))
    .filter((quiz): quiz is Quiz => Boolean(quiz));

  return <QuizGrid quizzes={playableQuizzes.length > 0 ? playableQuizzes : fallbackQuizzes} />;
}

export function ConvexQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  if (!convexEnv.isConfigured) {
    return <QuizGrid quizzes={fallbackQuizzes} />;
  }

  return <LiveQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
}
