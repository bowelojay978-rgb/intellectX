"use client";

import { CourseCard } from "@/components/education/course-card";
import { EmptyState } from "@/components/education/empty-state";
import { glassCardClassName } from "@/components/education/glass-card";
import { LocalQuizAverageStat } from "@/components/education/local-quiz-average-stat";
import { RecentQuizAttempts } from "@/components/education/recent-quiz-attempts";
import { StreakCard } from "@/components/education/streak-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
} from "@/lib/course-selection";
import { BookOpenCheckIcon, TrophyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function LocalProgressContent() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncSelectionWhenVisible() {
      if (!document.hidden) {
        syncSelection();
      }
    }

    syncSelection();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
    window.addEventListener("storage", syncSelection);
    window.addEventListener("focus", syncSelection);
    window.addEventListener("pageshow", syncSelection);
    document.addEventListener("visibilitychange", syncSelectionWhenVisible);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
      window.removeEventListener("storage", syncSelection);
      window.removeEventListener("focus", syncSelection);
      window.removeEventListener("pageshow", syncSelection);
      document.removeEventListener("visibilitychange", syncSelectionWhenVisible);
    };
  }, []);

  const selectedCourses = useMemo(() => {
    const selectedIds = selection?.selectedCourseIds ?? [];
    return courses.filter((course) => selectedIds.includes(course.id));
  }, [selection]);

  return (
    <>
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">No progress recorded yet</p>
            <p className="text-muted-foreground text-sm">
              Complete lessons or quizzes to build progress in this browser.
            </p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent>
            <TrophyIcon className="mb-3 size-5" />
            <LocalQuizAverageStat />
          </CardContent>
        </Card>
        <StreakCard compact />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Selected courses</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCourses.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {selectedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} showProgress={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No selected courses yet"
                description="Choose courses before course progress can be shown here."
                actionHref="/courses"
                actionLabel="Choose courses"
                icon={BookOpenCheckIcon}
              />
            )}
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <RecentQuizAttempts />
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Progress notes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              Account-level progress persistence is not active yet. This page only uses activity recorded locally in this
              browser.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
