"use client";

import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import type { Course } from "@/data/courses";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
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

function FallbackCoursesSection({ fallbackCourses }: ConvexCoursesSectionProps) {
  return (
    <>
      <div className="mb-4 flex justify-center">
        <DataSourceBadge />
      </div>
      <section className="grid gap-5 md:grid-cols-3">
        {fallbackCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </section>
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
