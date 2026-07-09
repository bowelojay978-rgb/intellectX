"use client";

import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";
import type { Quiz } from "@/data/quizzes";
import { readQuizAttemptHistory } from "@/lib/quiz-attempt-history";
import {
  type AcademicProfile,
  loadAcademicProfile,
  quizMatchesAcademicProfile,
} from "@/lib/academic-profile";
import { convexEnv } from "@/lib/education-data";
import { type LearnerCatalog, useLearnerCatalog } from "@/lib/learner-catalog-client";
import { ClockIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

function QuizGrid({ quizzes, catalog }: { quizzes: Quiz[]; catalog: LearnerCatalog }) {
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
            const course = catalog.courseById.get(quiz.courseId);
            const lesson = quiz.lessonId ? catalog.lessonById.get(quiz.lessonId) : null;
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

function PersonalizedQuizzes({ quizzes, courses, catalog }: { quizzes: Quiz[]; courses: Course[]; catalog: LearnerCatalog }) {
  const profile = useAcademicProfile();

  if (!profile) {
    return <QuizGrid quizzes={quizzes} catalog={catalog} />;
  }

  const matchedQuizzes = quizzes.filter((quiz) => quizMatchesAcademicProfile(quiz, courses, profile));

  return (
    <div className="space-y-6">
      {matchedQuizzes.length > 0 ? (
        <QuizGrid quizzes={matchedQuizzes} catalog={catalog} />
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
            <QuizGrid quizzes={quizzes} catalog={catalog} />
          </section>
        </>
      )}
    </div>
  );
}

function FallbackQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  const catalog = useLearnerCatalog();
  const quizzes = convexEnv.isConfigured ? catalog.quizzes : fallbackQuizzes;

  return (
    <>
      <div className="mb-4 flex justify-center">
        <DataSourceBadge />
      </div>
      <PersonalizedQuizzes quizzes={quizzes} courses={catalog.courses} catalog={catalog} />
    </>
  );
}

export function ConvexQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  return <FallbackQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
}


