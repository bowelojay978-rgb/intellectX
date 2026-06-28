"use client";

import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { glassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/courses";
import {
  type AcademicProfile,
  courseMatchesAcademicProfile,
  formatAcademicProfile,
  loadAcademicProfile,
} from "@/lib/academic-profile";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { BookOpenIcon, GraduationCapIcon } from "lucide-react";
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

function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <section className="grid gap-5 md:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </section>
  );
}

function useAcademicProfile() {
  const [profile, setProfile] = useState<AcademicProfile | null>(null);

  useEffect(() => {
    function syncProfile() {
      setProfile(loadAcademicProfile());
    }

    syncProfile();
    window.addEventListener("intellectx-academic-profile-change", syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener("intellectx-academic-profile-change", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  return profile;
}

function PersonalizedCourses({ courses }: { courses: Course[] }) {
  const profile = useAcademicProfile();

  if (!profile) {
    return <CourseGrid courses={courses} />;
  }

  const matchedCourses = courses.filter((course) => courseMatchesAcademicProfile(course, profile));

  return (
    <div className="space-y-6">
      <section className={`rounded-lg border p-5 ${glassCardClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="bg-secondary grid size-10 shrink-0 place-items-center rounded-full">
              <GraduationCapIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold tracking-tight">Personalized for your study profile</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {formatAcademicProfile(profile)} / {profile.subjectsOrModules.join(", ")}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/profile#study-profile">Edit profile</Link>
          </Button>
        </div>
      </section>
      {matchedCourses.length > 0 ? (
        <CourseGrid courses={matchedCourses} />
      ) : (
        <>
          <EmptyState
            title="No exact course matches yet"
            description="The demo catalog is still small. Edit your study profile or browse all available courses below."
            actionHref="/profile#study-profile"
            actionLabel="Edit study profile"
            icon={BookOpenIcon}
          />
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">All available courses</h2>
            <CourseGrid courses={courses} />
          </section>
        </>
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
