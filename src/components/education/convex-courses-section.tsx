"use client";

import { CourseCard } from "@/components/education/course-card";
import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/courses";
import {
  type AcademicProfile,
  courseMatchesAcademicProfile,
  loadAcademicProfile,
} from "@/lib/academic-profile";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  COURSE_SELECTION_GRACE_PERIOD_DAYS,
  COURSE_SELECTION_LIMIT,
  COURSE_SELECTION_SYNC_STATUS_EVENT,
  type CourseSelection,
  type CourseSelectionSyncStatus,
  type CourseSelectionSyncStatusDetail,
  getSelectedCourseIdsOutsideVisibleCourses,
  loadCourseSelection,
  retryCourseSelectionSync,
  toggleSelectedCourse,
} from "@/lib/course-selection";
import { convexEnv } from "@/lib/education-data";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { BookOpenIcon, GraduationCapIcon, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

type ConvexCoursesSectionProps = {
  fallbackCourses: Course[];
};

function useCourseSelection() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<CourseSelectionSyncStatus>("idle");

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    function syncSelectionWhenVisible() {
      if (!document.hidden) {
        syncSelection();
      }
    }

    function syncPersistenceStatus(event: Event) {
      const detail = (event as CustomEvent<CourseSelectionSyncStatusDetail>).detail;
      setSyncStatus(detail?.status ?? "idle");
    }

    syncSelection();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
    window.addEventListener(COURSE_SELECTION_SYNC_STATUS_EVENT, syncPersistenceStatus);
    window.addEventListener("storage", syncSelection);
    window.addEventListener("focus", syncSelection);
    window.addEventListener("pageshow", syncSelection);
    document.addEventListener("visibilitychange", syncSelectionWhenVisible);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
      window.removeEventListener(COURSE_SELECTION_SYNC_STATUS_EVENT, syncPersistenceStatus);
      window.removeEventListener("storage", syncSelection);
      window.removeEventListener("focus", syncSelection);
      window.removeEventListener("pageshow", syncSelection);
      document.removeEventListener("visibilitychange", syncSelectionWhenVisible);
    };
  }, []);

  function toggleCourse(courseId: string) {
    const update = toggleSelectedCourse(courseId);
    setSelection(update.selection);
    setError(update.error ?? null);
  }

  return { selection, error, syncStatus, toggleCourse };
}

function CourseSelectionSyncFeedback({ status }: { status: CourseSelectionSyncStatus }) {
  if (status === "pending") {
    return (
      <p className="text-muted-foreground mt-3 text-sm" role="status" aria-live="polite">
        Saving course selection to your account…
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="text-muted-foreground mt-3 text-sm" role="status" aria-live="polite">
        Course selection saved to your account.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="border-destructive/30 bg-destructive/5 mt-3 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
        <p className="text-destructive text-sm leading-6">
          We couldn&apos;t sync your course selection. Your current selection is still saved on this device.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={retryCourseSelectionSync}>
          Retry sync
        </Button>
      </div>
    );
  }

  return null;
}

function CourseSelectionFilters({
  courses,
  allCourses,
  selectedCourseIds,
  locked,
  error,
  syncStatus,
  onToggle,
}: {
  courses: Course[];
  allCourses: Course[];
  selectedCourseIds: string[];
  locked: boolean;
  error: string | null;
  syncStatus: CourseSelectionSyncStatus;
  onToggle: (courseId: string) => void;
}) {
  const visibleCourseIds = courses.map((course) => course.id);
  const otherSelectedCourseIds = getSelectedCourseIdsOutsideVisibleCourses(selectedCourseIds, visibleCourseIds);
  const courseById = new Map(allCourses.map((course) => [course.id, course]));

  return (
    <section
      aria-label="Course filters"
      className="border-border/70 bg-background/70 mb-5 rounded-lg border px-4 py-3 text-sm text-muted-foreground backdrop-blur"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="inline-flex items-start gap-2 leading-6">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          Choose up to {COURSE_SELECTION_LIMIT} courses. You have a {COURSE_SELECTION_GRACE_PERIOD_DAYS}-day grace
          period to adjust them, then your selection locks.
        </p>
        <div className="shrink-0 sm:text-right">
          <p className="font-medium text-foreground">
            {selectedCourseIds.length} / {COURSE_SELECTION_LIMIT} selected
          </p>
          {locked ? (
            <p className="mt-1 text-xs font-medium text-foreground" role="status">
              Selection locked
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {courses.map((course) => {
          const selected = selectedCourseIds.includes(course.id);

          return (
            <Button
              key={course.id}
              type="button"
              variant={selected ? "secondary" : "outline"}
              size="sm"
              disabled={locked}
              aria-pressed={selected}
              onClick={() => onToggle(course.id)}
            >
              {course.title}
            </Button>
          );
        })}
      </div>
      {otherSelectedCourseIds.length > 0 ? (
        <div className="border-border/70 mt-4 rounded-lg border border-dashed p-3">
          <p className="font-medium text-foreground">Other selected courses</p>
          <p className="mt-1 text-sm leading-6">
            These selections are outside the current course list but still count toward your {COURSE_SELECTION_LIMIT}-course limit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherSelectedCourseIds.map((courseId) => {
              const course = courseById.get(courseId);
              const label = course?.title ?? "Course no longer available";

              return (
                <Button
                  key={courseId}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={locked}
                  aria-pressed="true"
                  aria-label={`Remove selected course ${course?.title ?? courseId}`}
                  onClick={() => onToggle(courseId)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-destructive mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <CourseSelectionSyncFeedback status={syncStatus} />
    </section>
  );
}

function CourseGrid({ courses, allCourses }: { courses: Course[]; allCourses: Course[] }) {
  const { selection, error, syncStatus, toggleCourse } = useCourseSelection();
  const selectedCourseIds = selection?.selectedCourseIds ?? [];
  const locked = Boolean(selection?.locked);

  return (
    <>
      <CourseSelectionFilters
        courses={courses}
        allCourses={allCourses}
        selectedCourseIds={selectedCourseIds}
        locked={locked}
        error={error}
        syncStatus={syncStatus}
        onToggle={toggleCourse}
      />
      <section className="grid gap-5 md:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} showProgress={false} />
        ))}
      </section>
    </>
  );
}

function useAcademicProfile() {
  const [profile, setProfile] = useState<AcademicProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function syncProfile() {
      setProfile(loadAcademicProfile());
      setLoaded(true);
    }

    syncProfile();
    window.addEventListener("intellectx-academic-profile-change", syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener("intellectx-academic-profile-change", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  return { profile, loaded };
}

function PersonalizedCourses({ courses }: { courses: Course[] }) {
  const { profile, loaded } = useAcademicProfile();

  if (!loaded) {
    return null;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Complete your study profile first"
        description="Course selection unlocks after your academic level, curriculum, and subjects are saved."
        actionHref="/profile#study-profile"
        actionLabel="Set up profile"
        icon={GraduationCapIcon}
      />
    );
  }

  const matchedCourses = courses.filter((course) => courseMatchesAcademicProfile(course, profile));

  return (
    <div className="space-y-6">
      {matchedCourses.length > 0 ? (
        <CourseGrid courses={matchedCourses} allCourses={courses} />
      ) : (
        <EmptyState
          title="No exact course matches yet"
          description="The catalog is still growing. Edit your study profile to adjust the filtered course list."
          actionHref="/profile#study-profile"
          actionLabel="Edit study profile"
          icon={BookOpenIcon}
        />
      )}
    </div>
  );
}

function FallbackCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  return (
    <>
      <div className="mb-4 flex justify-center">
        <DataSourceBadge />
      </div>
      {fallbackCourses.length > 0 ? (
        <PersonalizedCourses courses={fallbackCourses} />
      ) : (
        <EmptyState
          title="No courses available yet"
          description="The course catalog is being prepared. Check the dashboard for your current learning overview."
          actionHref="/dashboard"
          actionLabel="Go to dashboard"
          icon={BookOpenIcon}
        />
      )}
    </>
  );
}

function LiveCoursesSection() {
  const catalog = useLearnerCatalog();

  if (catalog.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <AppLoadingSpinner label="Loading course catalog" showLabel />
      </div>
    );
  }

  return <FallbackCoursesSection fallbackCourses={catalog.courses} />;
}

export function ConvexCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  if (!convexEnv.isConfigured) {
    return <FallbackCoursesSection fallbackCourses={fallbackCourses} />;
  }

  return <LiveCoursesSection />;
}
