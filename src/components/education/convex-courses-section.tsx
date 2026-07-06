"use client";

import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/courses";
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
import { BookOpenIcon, GraduationCapIcon, InfoIcon } from "lucide-react";
import Link from "next/link";
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
};

type ConvexCoursesSectionProps = {
  fallbackCourses: Course[];
};

function normalizeCourse(course: ConvexCourse, fallbackCourses: Course[]): Course {
  const fallback = fallbackCourses.find((item) => item.id === course.stableId);

  return {
    id: course.stableId,
    slug: course.slug,
    title: course.title,
    description: course.description,
    subject: course.subject,
    level: course.level,
    duration: course.duration,
    progress: fallback?.progress ?? 0,
    lessonIds: fallback?.lessonIds ?? [],
    quizIds: fallback?.quizIds ?? [],
    accent: course.accent,
    accessLevel: course.accessLevel ?? fallback?.accessLevel,
  };
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
  selectedCourseIds,
  locked,
  error,
  onToggle,
}: {
  courses: Course[];
  selectedCourseIds: string[];
  locked: boolean;
  error: string | null;
  onToggle: (courseId: string) => void;
}) {
  const targetCount = Math.min(COURSE_SELECTION_LIMIT, courses.length);

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
        <p className="shrink-0 font-medium text-foreground">
          {selectedCourseIds.length} / {targetCount} selected
        </p>
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
      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
    </section>
  );
}

function CourseGrid({ courses }: { courses: Course[] }) {
  const { selection, error, toggleCourse } = useCourseSelection();
  const selectedCourseIds = selection?.selectedCourseIds ?? [];
  const locked = Boolean(selection?.locked);

  return (
    <>
      <CourseSelectionFilters
        courses={courses}
        selectedCourseIds={selectedCourseIds}
        locked={locked}
        error={error}
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
  const { selection } = useCourseSelection();
  const selectedCount = selection?.selectedCourseIds.length ?? 0;
  const selectionComplete = selectedCount >= Math.min(COURSE_SELECTION_LIMIT, courses.length);

  if (!loaded) {
    return null;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Complete your study profile first"
        description="Course selection unlocks after your academic level, curriculum, and subjects are saved."
        actionHref="/signup"
        actionLabel="Set up profile"
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
        {!selectionComplete ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile#study-profile">Edit profile</Link>
          </Button>
        ) : null}
      </div>
      {matchedCourses.length > 0 ? (
        <CourseGrid courses={matchedCourses} />
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

function LiveCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  const courses = useQuery(convexApi.courses.listCourses, {});

  if (!courses) {
    return <FallbackCoursesSection fallbackCourses={fallbackCourses} />;
  }

  const normalizedCourses = (courses as ConvexCourse[]).map((course) => normalizeCourse(course, fallbackCourses));

  return <FallbackCoursesSection fallbackCourses={normalizedCourses} />;
}

export function ConvexCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  if (!convexEnv.isConfigured) {
    return <FallbackCoursesSection fallbackCourses={fallbackCourses} />;
  }

  return <LiveCoursesSection fallbackCourses={fallbackCourses} />;
}
