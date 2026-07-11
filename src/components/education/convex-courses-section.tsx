"use client";

import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/courses";
import type { CourseStatus } from "@/lib/course-workflow-policy";
import {
  type AcademicProfile,
  courseMatchesAcademicProfile,
  formatAcademicProfile,
  loadAcademicProfile,
} from "@/lib/academic-profile";
import { convexApi } from "@/lib/convex-api";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  COURSE_SELECTION_GRACE_PERIOD_DAYS,
  COURSE_SELECTION_LIMIT,
  type CourseSelection,
  loadCourseSelection,
  toggleSelectedCourse,
} from "@/lib/course-selection";
import { convexEnv } from "@/lib/education-data";
import type { ContentAccessLevel } from "@/lib/entitlements";
import { normalizeLearnerCourse } from "@/lib/learner-catalog";
import { BookOpenIcon, CheckCircle2Icon, GraduationCapIcon, InfoIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";

type ConvexCourse = {
  stableId: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: Course["level"];
  duration: string;
  accent: string;
  accessLevel?: ContentAccessLevel;
  reviewStatus?: CourseStatus;
  publicationStatus?: CourseStatus;
  instructorId?: string;
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewReason?: string;
};

type ConvexCoursesSectionProps = {
  fallbackCourses: Course[];
};

function normalizeCourse(course: ConvexCourse, fallbackCourses: Course[]): Course | null {
  const fallback = fallbackCourses.find((item) => item.id === course.stableId);
  const normalizedCourse = normalizeLearnerCourse(course, fallback);

  return normalizedCourse
    ? {
        ...normalizedCourse,
        instructorId: course.instructorId ?? fallback?.instructorId,
        submittedAt: course.submittedAt ?? fallback?.submittedAt,
        reviewedAt: course.reviewedAt ?? fallback?.reviewedAt,
        reviewedBy: course.reviewedBy ?? fallback?.reviewedBy,
        reviewReason: course.reviewReason ?? fallback?.reviewReason,
      }
    : null;
}

function useCourseSelection() {
  const [selection, setSelection] = useState<CourseSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function toggleCourse(courseId: string) {
    const update = toggleSelectedCourse(courseId);
    setSelection(update.selection);
    setError(update.error ?? null);
  }

  return { selection, error, toggleCourse };
}

function CourseSelectionFilters({
  courses,
  selectedOutsideProfileCourses,
  unavailableSelectedCourseIds,
  selectedCourseIds,
  locked,
  error,
  setupMode,
  onToggle,
}: {
  courses: Course[];
  selectedOutsideProfileCourses: Course[];
  unavailableSelectedCourseIds: string[];
  selectedCourseIds: string[];
  locked: boolean;
  error: string | null;
  setupMode: boolean;
  onToggle: (courseId: string) => void;
}) {
  return (
    <section
      aria-label="Course filters"
      className="border-border/70 bg-background/70 mb-5 rounded-lg border px-4 py-4 text-sm text-muted-foreground backdrop-blur"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="inline-flex items-start gap-2 leading-6">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          Choose between 1 and {COURSE_SELECTION_LIMIT} courses. You have a {COURSE_SELECTION_GRACE_PERIOD_DAYS}-day grace
          period to adjust them, then your selection locks.
        </p>
        <p className="shrink-0 font-medium text-foreground">
          {selectedCourseIds.length} / {COURSE_SELECTION_LIMIT} selected
        </p>
      </div>

      {courses.length > 0 ? (
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
      ) : null}

      {selectedOutsideProfileCourses.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="font-medium text-foreground">Selected from a previous Study Profile</p>
          <p className="mt-1 leading-6">
            These courses still count toward your limit. Remove them here or keep them in your study plan.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOutsideProfileCourses.map((course) => (
              <Button
                key={course.id}
                type="button"
                variant="secondary"
                size="sm"
                disabled={locked}
                aria-pressed="true"
                onClick={() => onToggle(course.id)}
              >
                {course.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {unavailableSelectedCourseIds.length > 0 ? (
        <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-3">
          <p className="font-medium text-foreground">Unavailable selected courses</p>
          <p className="mt-1 leading-6">
            These older selections are no longer in the current catalog, but they still count toward your limit. Remove them below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unavailableSelectedCourseIds.map((courseId, index) => (
              <Button
                key={courseId}
                type="button"
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={() => onToggle(courseId)}
              >
                Remove unavailable course {index + 1}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}

      {setupMode ? (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          {selectedCourseIds.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2Icon className="size-4 text-success" />
                Your learning plan is ready.
              </p>
              <Button asChild>
                <Link href="/dashboard">Enter IntellectX</Link>
              </Button>
            </div>
          ) : (
            <p className="font-medium text-foreground">Choose at least one course to finish setting up your learning plan.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function CourseGrid({
  courses,
  allCourses,
  selection,
  error,
  setupMode,
  onToggle,
}: {
  courses: Course[];
  allCourses: Course[];
  selection: CourseSelection | null;
  error: string | null;
  setupMode: boolean;
  onToggle: (courseId: string) => void;
}) {
  const selectedCourseIds = selection?.selectedCourseIds ?? [];
  const locked = Boolean(selection?.locked);
  const matchedCourseIds = new Set(courses.map((course) => course.id));
  const allCourseIds = new Set(allCourses.map((course) => course.id));
  const selectedOutsideProfileCourses = allCourses.filter(
    (course) => selectedCourseIds.includes(course.id) && !matchedCourseIds.has(course.id),
  );
  const unavailableSelectedCourseIds = selectedCourseIds.filter((courseId) => !allCourseIds.has(courseId));

  return (
    <>
      <CourseSelectionFilters
        courses={courses}
        selectedOutsideProfileCourses={selectedOutsideProfileCourses}
        unavailableSelectedCourseIds={unavailableSelectedCourseIds}
        selectedCourseIds={selectedCourseIds}
        locked={locked}
        error={error}
        setupMode={setupMode}
        onToggle={onToggle}
      />
      {courses.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} showProgress={false} />
          ))}
        </section>
      ) : null}
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
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const { profile, loaded } = useAcademicProfile();
  const { selection, error, toggleCourse } = useCourseSelection();
  const selectedCount = selection?.selectedCourseIds.length ?? 0;

  if (!loaded) {
    return null;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Complete your Study Profile first"
        description="Course selection unlocks after your academic level, curriculum, and subjects are saved."
        actionHref="/onboarding"
        actionLabel="Set up Study Profile"
        icon={GraduationCapIcon}
      />
    );
  }

  const matchedCourses = courses.filter((course) => courseMatchesAcademicProfile(course, profile));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Filtered for {formatAcademicProfile(profile)} / {profile.subjectsOrModules.join(", ")}
        </p>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile#study-profile">Edit profile</Link>
        </Button>
      </div>

      {matchedCourses.length > 0 || selectedCount > 0 ? (
        <CourseGrid
          courses={matchedCourses}
          allCourses={courses}
          selection={selection}
          error={error}
          setupMode={setupMode}
          onToggle={toggleCourse}
        />
      ) : (
        <EmptyState
          title="No exact course matches yet"
          description="The catalog is still growing. Edit your Study Profile to adjust the filtered course list."
          actionHref="/profile#study-profile"
          actionLabel="Edit Study Profile"
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

function LiveCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  const courses = useQuery(convexApi.courses.listCourses, {});

  if (courses === undefined) {
    return (
      <div className="border-border/70 bg-background/70 rounded-lg border px-5 py-8 text-center text-sm text-muted-foreground backdrop-blur">
        Loading your available courses…
      </div>
    );
  }

  const normalizedCourses = (courses as ConvexCourse[])
    .map((course) => normalizeCourse(course, fallbackCourses))
    .filter((course): course is Course => Boolean(course));

  return <FallbackCoursesSection fallbackCourses={normalizedCourses} />;
}

export function ConvexCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  if (!convexEnv.isConfigured) {
    return <FallbackCoursesSection fallbackCourses={fallbackCourses} />;
  }

  return <LiveCoursesSection fallbackCourses={fallbackCourses} />;
}
