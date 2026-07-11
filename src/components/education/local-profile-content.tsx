"use client";

import { LearnerSessionName } from "@/components/auth/learner-session-name";
import { ProfileLearnerSession } from "@/components/auth/profile-learner-session";
import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { glassCardClassName, elevatedGlassCardClassName } from "@/components/education/glass-card";
import { ProfileAvatarEditor } from "@/components/education/profile-avatar-editor";
import { StatCard } from "@/components/education/stat-card";
import { StreakCard } from "@/components/education/streak-card";
import { StudyProfileCard } from "@/components/education/study-profile-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
} from "@/lib/course-selection";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  summarizeLessonProgressHistory,
  type LessonProgressHistorySummary,
} from "@/lib/lesson-progress-history";
import {
  QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT,
  readQuizAttemptHistory,
  summarizeQuizAttemptHistory,
} from "@/lib/quiz-attempt-history";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import {
  emptyStudyActivitySummary,
  formatStudyStreakValue,
  readStudyActivitySummary,
  type StudyActivitySummary,
} from "@/lib/study-activity-summary";
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  FlameIcon,
  SettingsIcon,
  ShieldIcon,
  TrophyIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyLessonProgressSummary: LessonProgressHistorySummary = {
  lessonCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  latestLessons: [],
};

export function LocalProfileContent() {
  const catalog = useLearnerCatalog();
  const profileSourceLabel = isClerkAuthEnabled() ? "Account-backed learner profile" : "Browser-backed learner profile";
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [lessonSummary, setLessonSummary] = useState<LessonProgressHistorySummary>(emptyLessonProgressSummary);
  const [studyActivity, setStudyActivity] = useState<StudyActivitySummary>(emptyStudyActivitySummary);
  const [quizAttemptCount, setQuizAttemptCount] = useState(0);
  const [averageQuizScore, setAverageQuizScore] = useState<number | null>(null);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncLessons() {
      setLessonSummary(summarizeLessonProgressHistory(readLessonProgressHistory()));
    }

    function syncAttempts() {
      const summary = summarizeQuizAttemptHistory(readQuizAttemptHistory());
      setQuizAttemptCount(summary.attemptCount);
      setAverageQuizScore(summary.attemptCount > 0 ? summary.averagePercentage : null);
    }

    function syncActivity() {
      setStudyActivity(readStudyActivitySummary());
    }

    function syncAll() {
      syncSelection();
      syncLessons();
      syncAttempts();
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

  const selectedCourses = useMemo(() => {
    const selectedIds = selection?.selectedCourseIds ?? [];
    return selectedIds
      .map((courseId) => catalog.courseById.get(courseId))
      .filter((course): course is Course => Boolean(course));
  }, [catalog.courseById, selection]);

  return (
    <>
      <section className={`animate-widget mb-8 flex flex-col gap-6 rounded-lg p-6 md:flex-row md:items-center md:p-8 ${elevatedGlassCardClassName}`}>
        <ProfileAvatarEditor />
        <div className="flex-1">
          <Badge variant="secondary" className="mb-3">
            Profile
          </Badge>
          <DataSourceBadge />
          <h1 className="text-4xl font-medium tracking-tight">
            <LearnerSessionName />
          </h1>
          <p className="text-muted-foreground mt-1">{profileSourceLabel}</p>
        </div>
        <div className="grid gap-1 text-sm md:text-right">
          <span className="text-muted-foreground">Last studied</span>
          <span className="font-medium">{studyActivity.lastStudiedLabel}</span>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Study streak" value={formatStudyStreakValue(studyActivity)} icon={FlameIcon} />
        <StatCard
          label="Completed lessons"
          value={lessonSummary.completedCount === 0 ? "No completed lessons yet" : `${lessonSummary.completedCount}`}
          icon={BookOpenCheckIcon}
        />
        <StatCard
          label="Average score"
          value={averageQuizScore === null ? "No attempts yet" : `${averageQuizScore}%`}
          icon={TrophyIcon}
        />
      </section>

      <section className="mb-8">
        <StudyProfileCard />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">Selected courses</h2>
          {selectedCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {selectedCourses.slice(0, 2).map((course) => (
                <CourseCard key={course.id} course={course} showProgress={false} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No selected courses on this profile"
              description="Choose courses to make this profile reflect your current study plan."
              actionHref="/courses"
              actionLabel="Choose courses"
              icon={BookOpenIcon}
            />
          )}
        </div>

        <div className="grid gap-5">
          <StreakCard summary={studyActivity} />
          <ProfileLearnerSession className={`rounded-lg ${glassCardClassName}`} />

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="size-5" />
                Account snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm leading-6">
              <p>Plan: Learner access</p>
              <p>Selected courses: {selectedCourses.length === 0 ? "None yet" : selectedCourses.length}</p>
              <p>Lesson activity: {lessonSummary.lessonCount === 0 ? "No lessons recorded yet" : `${lessonSummary.lessonCount} lessons viewed`}</p>
              <p>Quiz attempts: {quizAttemptCount === 0 ? "No attempts yet" : quizAttemptCount}</p>
            </CardContent>
          </Card>

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheckIcon className="size-5" />
                Study rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              {studyActivity.activeDateCount > 0
                ? `Activity has been recorded on ${studyActivity.activeDateCount} study day${studyActivity.activeDateCount === 1 ? "" : "s"}.`
                : "Study rhythm will appear after lessons or quizzes are recorded."}
            </CardContent>
          </Card>

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="size-5" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              Learning activity is read from this browser and can hydrate from account-backed data when available.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
