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
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  summarizeLessonProgressHistory,
  type LessonProgressHistorySummary,
} from "@/lib/lesson-progress-history";
import { BookOpenCheckIcon, TrophyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyLessonProgressSummary: LessonProgressHistorySummary = {
  lessonCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  latestLessons: [],
};

export function LocalProgressContent() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [lessonSummary, setLessonSummary] = useState<LessonProgressHistorySummary>(emptyLessonProgressSummary);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncLessons() {
      setLessonSummary(summarizeLessonProgressHistory(readLessonProgressHistory()));
    }

    function syncAll() {
      syncSelection();
      syncLessons();
    }

    function syncAllWhenVisible() {
      if (!document.hidden) {
        syncAll();
      }
    }

    syncAll();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
    window.addEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncAll);
    window.addEventListener("storage", syncAll);
    window.addEventListener("focus", syncAll);
    window.addEventListener("pageshow", syncAll);
    document.addEventListener("visibilitychange", syncAllWhenVisible);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
      window.removeEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncAll);
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
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">
              {lessonSummary.lessonCount > 0 ? `${lessonSummary.lessonCount} lesson activity` : "No progress recorded yet"}
            </p>
            <p className="text-muted-foreground text-sm">
              {lessonSummary.lessonCount > 0
                ? `${lessonSummary.inProgressCount} in progress, ${lessonSummary.completedCount} completed.`
                : "Complete lessons or quizzes to build progress in this browser."}
            </p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent>
            <TrophyIcon className="mb-3 size-5" />
            <LocalQuizAverageStat />
          </CardContent>
        </Card>
        <StreakCard compact hasActivity={lessonSummary.lessonCount > 0} />
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
              Account-backed quiz history, study profile, course selection, and lesson activity hydrate here when available.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
