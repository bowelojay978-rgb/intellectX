"use client";

import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import { lessons } from "@/data/lessons";
import type { Quiz } from "@/data/quizzes";
import { readQuizAttemptHistory } from "@/lib/quiz-attempt-history";
import {
  type AcademicProfile,
  formatAcademicProfile,
  loadAcademicProfile,
  quizMatchesAcademicProfile,
} from "@/lib/academic-profile";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { ClockIcon, FileQuestionIcon, GraduationCapIcon } from "lucide-react";
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

type QuizAttemptSummary = {
  completed: boolean;
  percent?: number;
};

function getStoredAttempt(quizId: string): QuizAttemptSummary {
  const latestAttempt = readQuizAttemptHistory().find((attempt) => attempt.quizId === quizId);

  if (!latestAttempt) {
    return { completed: false };
  }

  return {
    completed: true,
    percent: latestAttempt.percentage,
  };
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

function useAcademicProfile() {
  const [profile, setProfile] = useState<AcademicProfile | null>(null);

  useEffect(() => {
    function syncProfile() {
      setProfile(loadAcademicProfile());
    }

    syncProfile();
    window.addEventListener("intellectx-academic-profile-change", syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener("intellectx-academic-profile-change", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  return profile;
}

function QuizGrid({ quizzes }: { quizzes: Quiz[] }) {
  const [localAttempts, setLocalAttempts] = useState<Record<string, QuizAttemptSummary>>({});

  useEffect(() => {
    function syncAttempts() {
      setLocalAttempts(Object.fromEntries(quizzes.map((quiz) => [quiz.id, getStoredAttempt(quiz.id)])));
    }

    syncAttempts();
    window.addEventListener("pageshow", syncAttempts);
    window.addEventListener("focus", syncAttempts);

    return () => {
      window.removeEventListener("pageshow", syncAttempts);
      window.removeEventListener("focus", syncAttempts);
    };
  }, [quizzes]);

  return (
    <>
      {quizzes.length > 0 ? (
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
                <Card className={`animate-widget rounded-lg ${glassCardClassName} ${clickableGlassCardClassName}`}>
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
                    <span className={buttonVariants({ className: "w-full" })}>
                      {hasScore ? "Review quiz" : "Start quiz"}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="No quizzes ready yet"
          description="Knowledge checks will appear here when course practice is available."
          actionHref="/courses"
          actionLabel="Browse courses"
          icon={FileQuestionIcon}
        />
      )}
    </>
  );
}

function PersonalizedQuizzes({ quizzes }: { quizzes: Quiz[] }) {
  const profile = useAcademicProfile();

  if (!profile) {
    return <QuizGrid quizzes={quizzes} />;
  }

  const matchedQuizzes = quizzes.filter((quiz) => quizMatchesAcademicProfile(quiz, courses, profile));

  return (
    <div className="space-y-6">
      <section className={`rounded-lg border p-5 ${glassCardClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="bg-secondary grid size-10 shrink-0 place-items-center rounded-full">
              <GraduationCapIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold tracking-tight">Personalized for your study profile</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {formatAcademicProfile(profile)} / {profile.subjectsOrModules.join(", ")}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/profile#study-profile">Edit profile</Link>
          </Button>
        </div>
      </section>
      {matchedQuizzes.length > 0 ? (
        <QuizGrid quizzes={matchedQuizzes} />
      ) : (
        <>
          <EmptyState
            title="No exact quiz matches yet"
            description="The catalog is still growing. Edit your study profile or use the available quizzes below."
            actionHref="/profile#study-profile"
            actionLabel="Edit study profile"
            icon={FileQuestionIcon}
          />
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">All available quizzes</h2>
            <QuizGrid quizzes={quizzes} />
          </section>
        </>
      )}
    </div>
  );
}

function FallbackQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  return (
    <>
      <div className="mb-4 flex justify-center">
        <DataSourceBadge />
      </div>
      <PersonalizedQuizzes quizzes={fallbackQuizzes} />
    </>
  );
}

function LiveQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  const quizzes = useQuery(convexApi.quizzes.listQuizzes, {});

  if (!quizzes) {
    return <FallbackQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
  }

  const playableQuizzes = (quizzes as ConvexQuiz[])
    .map((quiz) => normalizeQuiz(quiz, fallbackQuizzes))
    .filter((quiz): quiz is Quiz => Boolean(quiz));

  return <FallbackQuizzesSection fallbackQuizzes={playableQuizzes.length > 0 ? playableQuizzes : fallbackQuizzes} />;
}

export function ConvexQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  if (!convexEnv.isConfigured) {
    return <FallbackQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
  }

  return <LiveQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
}


