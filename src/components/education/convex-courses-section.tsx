"use client";

import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/courses";
import {
  type AcademicProfile,
  courseMatchesAcademicProfile,
  formatAcademicProfile,
  loadAcademicProfile,
} from "@/lib/academic-profile";
import {
  COURSE_SELECTION_GRACE_PERIOD_DAYS,
  COURSE_SELECTION_LIMIT,
  type CourseSelection,
  COURSE_SELECTION_CHANGE_EVENT,
  getEmptyCourseSelection,
  loadCourseSelection,
  toggleSelectedCourse,
} from "@/lib/course-selection";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { BookOpenIcon, GraduationCapIcon, LockIcon } from "lucide-react";
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
  };
}

function formatSelectionDate(timestamp: number | null) {
  if (!timestamp) return "Not started";

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(timestamp));
}

function CompactCourseSelectionStatus({ selection, error }: { selection: CourseSelection; error: string | null }) {
  return (
    <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {selection.selectedCourseIds.length} / {COURSE_SELECTION_LIMIT} selected
        </Badge>
        <Badge variant={selection.locked ? "secondary" : "outline"} className="gap-2">
          {selection.locked ? <LockIcon className="size-3" /> : null}
          {selection.locked ? "Locked" : `${COURSE_SELECTION_GRACE_PERIOD_DAYS}-day grace period`}
        </Badge>
        <span>Ends {formatSelectionDate(selection.gracePeriodEndsAt)}. Resets require support later.</span>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
    </div>
  );
}

function CourseGrid({
  courses,
  selection,
  onToggleCourse,
}: {
  courses: Course[];
  selection: CourseSelection;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <section className="grid gap-5 md:grid-cols-3">
      {courses.map((course) => {
        const selected = selection.selectedCourseIds.includes(course.id);

        return (
          <article key={course.id} className="grid gap-3">
            <CourseCard
              course={course}
              selectionState={selection.locked ? (selected ? "selectedLocked" : "locked") : selected ? "selected" : "available"}
              onToggleSelection={() => onToggleCourse(course.id)}
            />
          </article>
        );
      })}
    </section>
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

function useCourseSelection() {
  const [selection, setSelection] = useState<CourseSelection>(getEmptyCourseSelection);

  useEffect(() => {
    function syncSelection() {
      setSelection(loadCourseSelection());
    }

    syncSelection();
    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
    window.addEventListener("storage", syncSelection);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  return { selection, setSelection };
}

function PersonalizedCourses({ courses }: { courses: Course[] }) {
  const { profile, loaded } = useAcademicProfile();
  const { selection, setSelection } = useCourseSelection();
  const [selectionError, setSelectionError] = useState<string | null>(null);

  function handleToggleCourse(courseId: string) {
    const update = toggleSelectedCourse(courseId, selection);
    setSelection(update.selection);
    setSelectionError(update.error ?? null);
  }

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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Filtered for {formatAcademicProfile(profile)} / {profile.subjectsOrModules.join(", ")}
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile#study-profile">Edit profile</Link>
          </Button>
        </div>
        <CompactCourseSelectionStatus selection={selection} error={selectionError} />
      </div>
      {matchedCourses.length > 0 ? (
        <CourseGrid courses={matchedCourses} selection={selection} onToggleCourse={handleToggleCourse} />
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

