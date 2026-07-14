"use client";

import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { CourseCard } from "@/components/education/course-card";
import { EmptyState } from "@/components/education/empty-state";
import { glassCardClassName } from "@/components/education/glass-card";
import { LocalQuizAverageStat } from "@/components/education/local-quiz-average-stat";
import { RecentQuizAttempts } from "@/components/education/recent-quiz-attempts";
import { StreakCard } from "@/components/education/streak-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
} from "@/lib/course-selection";
import { calculateCourseProgress } from "@/lib/course-progress";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  summarizeLessonProgressHistory,
  type LessonProgressHistoryItem,
  type LessonProgressHistorySummary,
} from "@/lib/lesson-progress-history";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT } from "@/lib/quiz-attempt-history";
import {
  emptyStudyActivitySummary,
  readStudyActivitySummary,
  type StudyActivitySummary,
} from "@/lib/study-activity-summary";
import { BookOpenCheckIcon, TrophyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyLessonProgressSummary: LessonProgressHistorySummary = {
  lessonCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  latestLessons: [],
};

export function LocalProgressContent() {
  const catalog = useLearnerCatalog();
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [lessonHistory, setLessonHistory] = useState<LessonProgressHistoryItem[]>([]);
  const [lessonSummary, setLessonSummary] = useState<LessonProgressHistorySummary>(emptyLessonProgressSummary);
  const [studyActivity, setStudyActivity] = useState<StudyActivitySummary>(emptyStudyActivitySummary);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncLessons() {
      const history = readLessonProgressHistory();
      setLessonHistory(history);
      setLessonSummary(summarizeLessonProgressHistory(history));
    }

    function syncActivity() {
      setStudyActivity(readStudyActivitySummary());
    }

    function syncAll() {
      syncSelection();
      syncLessons();
      syncActivity();
    }

    function syncAllWhenVisible() {
      if (!document.hidden) {
        syncAll();
      }
    }

    syncAll();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
    window.addEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncAll);
    window.addEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncAll);
    window.addEventListener("storage", syncAll);
    window.addEventListener("focus", syncAll);
    window.addEventListener("pageshow", syncAll);
    document.addEventListener("visibilitychange", syncAllWhenVisible);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncAll);
      window.removeEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncAll);
      window.removeEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncAll);
      window.removeEventListener("storage", syncAll);
      window.removeEventListener("focus", syncAll);
      window.removeEventListener("pageshow", syncAll);
      document.removeEventListener("visibilitychange", syncAllWhenVisible);
    };
  }, []);

  const selectedCourseIds = selection?.selectedCourseIds ?? [];
  const selectionReady = selection !== null;

  const selectedCourses = useMemo(
    () =>
      selectedCourseIds
        .map((courseId) => catalog.courseById.get(courseId))
        .filter((course): course is Course => Boolean(course)),
    [catalog.courseById, selectedCourseIds],
  );

  const selectedCoursesWithProgress = useMemo(
    () =>
      selectedCourses.map((course) => ({
        ...course,
        progress: calculateCourseProgress(course.lessonIds, lessonHistory),
      })),
    [lessonHistory, selectedCourses],
  );

  const unavailableSelectedCourseCount = Math.max(0, selectedCourseIds.length - selectedCourses.length);
  const waitingForSelectedCourseCatalog = catalog.isLoading && selectedCourseIds.length > 0;

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
        <StreakCard compact summary={studyActivity} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Selected courses</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectionReady || waitingForSelectedCourseCatalog ? (
              <div className="flex min-h-40 items-center justify-center" role="status" aria-live="polite">
                <AppLoadingSpinner label="Loading selected course progress" showLabel />
              </div>
            ) : selectedCoursesWithProgress.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-5 md:grid-cols-2">
                  {selectedCoursesWithProgress.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                {unavailableSelectedCourseCount > 0 ? (
                  <p className="text-muted-foreground text-sm" role="status">
                    {unavailableSelectedCourseCount} selected course{unavailableSelectedCourseCount === 1 ? " is" : "s are"}{" "}
                    temporarily unavailable in the current catalog. Your selection is preserved and no progress is invented.
                  </p>
                ) : null}
              </div>
            ) : selectedCourseIds.length > 0 ? (
              <EmptyState
                title="Selected courses are unavailable right now"
                description="Your course selection is preserved. Progress will appear when those courses are available in the current catalog."
                actionHref="/courses"
                actionLabel="View course selection"
                icon={BookOpenCheckIcon}
              />
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
