"use client";

import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/data/quizzes";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
} from "@/lib/course-selection";
import { convexEnv } from "@/lib/education-data";
import { type LearnerCatalog, useLearnerCatalog } from "@/lib/learner-catalog-client";
import {
  QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT,
  readQuizAttemptHistory,
} from "@/lib/quiz-attempt-history";
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

function useSelectedCoursePlan() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
      setLoaded(true);
    }

    syncSelection();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
    window.addEventListener("storage", syncSelection);
    window.addEventListener("pageshow", syncSelection);
    window.addEventListener("focus", syncSelection);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
      window.removeEventListener("storage", syncSelection);
      window.removeEventListener("pageshow", syncSelection);
      window.removeEventListener("focus", syncSelection);
    };
  }, []);

  return { selection, loaded };
}

function QuizGrid({ quizzes, catalog }: { quizzes: Quiz[]; catalog: LearnerCatalog }) {
  const [localAttempts, setLocalAttempts] = useState<Record<string, QuizAttemptSummary>>({});

  useEffect(() => {
    function syncAttempts() {
      setLocalAttempts(Object.fromEntries(quizzes.map((quiz) => [quiz.id, getStoredAttempt(quiz.id)])));
    }

    syncAttempts();
    window.addEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncAttempts);
    window.addEventListener("storage", syncAttempts);
    window.addEventListener("pageshow", syncAttempts);
    window.addEventListener("focus", syncAttempts);

    return () => {
      window.removeEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncAttempts);
      window.removeEventListener("storage", syncAttempts);
      window.removeEventListener("pageshow", syncAttempts);
      window.removeEventListener("focus", syncAttempts);
    };
  }, [quizzes]);

  return (
    <section className="grid gap-5 md:grid-cols-3">
      {quizzes.map((quiz) => {
        const course = catalog.courseById.get(quiz.courseId);
        const lesson = quiz.lessonId ? catalog.lessonById.get(quiz.lessonId) : null;
        const localAttempt = localAttempts[quiz.id];
        const score = localAttempt?.percent;
        const hasScore = typeof score === "number";
        const status = localAttempt?.completed ? "Completed" : "Not started";

        return (
          <Link key={quiz.id} href={`/quiz/${quiz.id}?from=quizzes`} className="block">
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
                  {hasScore ? "Retake quiz" : "Start quiz"}
                </span>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </section>
  );
}

function PlannedQuizzes({ quizzes, catalog }: { quizzes: Quiz[]; catalog: LearnerCatalog }) {
  const { selection, loaded } = useSelectedCoursePlan();

  if (!loaded) {
    return null;
  }

  const selectedCourseIds = selection?.selectedCourseIds ?? [];

  if (selectedCourseIds.length === 0) {
    return (
      <EmptyState
        title="Choose at least one course first"
        description="Your quiz hub follows your selected study plan. Choose a course to unlock its available quizzes here."
        actionHref="/courses?setup=1"
        actionLabel="Choose courses"
        icon={FileQuestionIcon}
      />
    );
  }

  const plannedQuizzes = quizzes.filter((quiz) => selectedCourseIds.includes(quiz.courseId));

  if (plannedQuizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes for your selected courses yet"
        description="Your current study plan has no available quizzes yet. You can adjust selected courses during the grace period."
        actionHref="/courses"
        actionLabel="Review selected courses"
        icon={FileQuestionIcon}
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        Showing quizzes from your {selectedCourseIds.length} selected course{selectedCourseIds.length === 1 ? "" : "s"}.
      </p>
      <QuizGrid quizzes={plannedQuizzes} catalog={catalog} />
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
      <PlannedQuizzes quizzes={quizzes} catalog={catalog} />
    </>
  );
}

export function ConvexQuizzesSection({ fallbackQuizzes }: ConvexQuizzesSectionProps) {
  return <FallbackQuizzesSection fallbackQuizzes={fallbackQuizzes} />;
}
