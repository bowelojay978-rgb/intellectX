"use client";

import { CourseCard } from "@/components/education/course-card";
import { EmptyState } from "@/components/education/empty-state";
import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { LocalQuizPerformance } from "@/components/education/local-quiz-performance";
import { RecentQuizAttempts } from "@/components/education/recent-quiz-attempts";
import { StatCard } from "@/components/education/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
} from "@/lib/course-selection";
import { readQuizAttemptHistory, summarizeQuizAttemptHistory } from "@/lib/quiz-attempt-history";
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  FlameIcon,
  GraduationCapIcon,
  Layers3Icon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function LocalDashboardContent() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [quizAttemptCount, setQuizAttemptCount] = useState(0);
  const [averageQuizScore, setAverageQuizScore] = useState<number | null>(null);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncAttempts() {
      const summary = summarizeQuizAttemptHistory(readQuizAttemptHistory());
      setQuizAttemptCount(summary.attemptCount);
      setAverageQuizScore(summary.attemptCount > 0 ? summary.averagePercentage : null);
    }

    function syncAll() {
      syncSelection();
      syncAttempts();
    }

    function syncAllWhenVisible() {
      if (!document.hidden) {
        syncAll();
      }
    }

    syncAll();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
    window.addEventListener("storage", syncAll);
    window.addEventListener("focus", syncAll);
    window.addEventListener("pageshow", syncAll);
    document.addEventListener("visibilitychange", syncAllWhenVisible);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
      window.removeEventListener("storage", syncAll);
      window.removeEventListener("focus", syncAll);
      window.removeEventListener("pageshow", syncAll);
      document.removeEventListener("visibilitychange", syncAllWhenVisible);
    };
  }, []);

  const selectedCourses = useMemo(() => {
    const selectedIds = selection?.selectedCourseIds ?? [];
    return courses.filter((course) => selectedIds.includes(course.id));
  }, [selection]);

  return (
    <>
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Study streak" value="No activity yet" icon={FlameIcon} />
        <StatCard label="Total hours" value="Not tracked yet" icon={GraduationCapIcon} />
        <StatCard label="Lessons done" value="No lessons recorded" icon={BookOpenCheckIcon} />
        <StatCard
          label="Avg. quiz score"
          value={averageQuizScore === null ? "No attempts yet" : `${averageQuizScore}%`}
          icon={TrophyIcon}
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Selected courses</h2>
            <Link href="/courses" className="text-muted-foreground text-sm underline underline-offset-4">
              Manage
            </Link>
          </div>
          {selectedCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {selectedCourses.map((course) => (
                <CourseCard key={course.id} course={course} showProgress={false} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No selected courses yet"
              description="Choose courses to make this dashboard reflect your current study plan."
              actionHref="/courses"
              actionLabel="Choose courses"
              icon={BookOpenIcon}
            />
          )}
        </div>
        <div className="grid gap-5">
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Study shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                href="/mobile-quizzes"
                aria-label="Open mobile quizzes"
                className={`bg-secondary/40 hover:bg-secondary flex items-center gap-3 rounded-lg p-4 ${clickableGlassCardClassName}`}
              >
                <BookOpenCheckIcon className="size-5" />
                <div>
                  <p className="font-medium">Quizzes</p>
                  <p className="text-muted-foreground mt-1 text-sm">Start your next knowledge check.</p>
                </div>
              </Link>
              <Link
                href="/mobile-flashcards"
                aria-label="Open mobile flashcards"
                className={`bg-secondary/40 hover:bg-secondary flex items-center gap-3 rounded-lg p-4 ${clickableGlassCardClassName}`}
              >
                <Layers3Icon className="size-5" />
                <div>
                  <p className="font-medium">Flashcards</p>
                  <p className="text-muted-foreground mt-1 text-sm">Review flashcard-style lesson cards.</p>
                </div>
              </Link>
            </CardContent>
          </Card>
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Recent lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
                Recent lessons will appear after lesson completion is recorded in this browser.
              </div>
            </CardContent>
          </Card>
          <LocalQuizPerformance />
          <RecentQuizAttempts />
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="size-5" />
                Next step
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4 text-sm leading-6">
              <p>
                {selectedCourses.length > 0
                  ? quizAttemptCount > 0
                    ? "Review your recent quiz attempts or continue with a selected course."
                    : "Start with one quiz or lesson from your selected courses to build real activity here."
                  : "Choose courses first, then complete lessons or quizzes to build your dashboard."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/courses">Courses</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/quizzes">Quizzes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
