"use client";

import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { useInstructorCourses } from "@/components/instructor/use-instructor-courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { convexEnv } from "@/lib/education-data";
import {
  type InstructorCourseStatus,
  formatInstructorWorkspaceDate,
  instructorCourseStatusLabels,
  instructorCourseStatusTone,
  isInstructorCourseEditable,
  isInstructorLearnerPreviewAvailable,
  resolveInstructorCourseStatus,
} from "@/lib/instructor-course-workspace";
import { AlertCircleIcon, EyeIcon, PencilIcon, PlusIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | InstructorCourseStatus;

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Under review", value: "submitted_for_review" },
  { label: "Changes requested", value: "changes_requested" },
  { label: "Approved", value: "approved" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export function InstructorCourseList() {
  if (!convexEnv.isConfigured) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Configure NEXT_PUBLIC_CONVEX_URL to load the production instructor course list.
        </CardContent>
      </Card>
    );
  }

  return <ConvexInstructorCourseList />;
}

function ConvexInstructorCourseList() {
  const { courses, loading, error, reload } = useInstructorCourses();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const status = resolveInstructorCourseStatus(course);
      const matchesFilter = filter === "all" || status === filter;
      const matchesQuery =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.subject.toLowerCase().includes(normalizedQuery) ||
        course.level.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [courses, filter, query]);

  if (loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading instructor courses…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircleIcon className="size-7 text-rose-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Unable to load instructor courses</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              {error}. Confirm the authenticated staff role is present in the Convex identity.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void reload()}>
            <RefreshCcwIcon className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "default" : "outline"}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <label className="border-input bg-background/75 flex h-10 w-full items-center gap-2 rounded-lg border px-3 lg:max-w-sm">
          <SearchIcon className="text-muted-foreground size-4" />
          <span className="sr-only">Search courses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, subject, or level"
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      {visibleCourses.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => {
            const status = resolveInstructorCourseStatus(course);
            const editable = isInstructorCourseEditable(course);
            const previewAvailable = isInstructorLearnerPreviewAvailable(course);

            return (
              <Card key={course.stableId} className={`rounded-lg ${glassCardClassName} ${clickableGlassCardClassName}`}>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${instructorCourseStatusTone[status]}`}>
                      {instructorCourseStatusLabels[status]}
                    </span>
                    <span className="text-muted-foreground text-xs">{formatInstructorWorkspaceDate(course.updatedAt)}</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl tracking-tight">{course.title}</CardTitle>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {course.subject} · {course.level}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground line-clamp-3 leading-6">{course.description}</p>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3">
                    <div>
                      <p className="text-lg font-semibold">{course.lessonCount}</p>
                      <p className="text-muted-foreground text-xs">Lessons</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{course.quizCount}</p>
                      <p className="text-muted-foreground text-xs">Quizzes</p>
                    </div>
                  </div>
                  {status === "changes_requested" && course.reviewReason ? (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm leading-6">
                      <p className="font-medium text-rose-700 dark:text-rose-300">Admin feedback</p>
                      <p className="text-muted-foreground mt-1">{course.reviewReason}</p>
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/instructor/courses/new?edit=${encodeURIComponent(course.stableId)}`}>
                      <PencilIcon className="size-4" />
                      {editable ? "Edit" : "View"}
                    </Link>
                  </Button>
                  {previewAvailable ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/courses/${encodeURIComponent(course.slug)}`}>
                        <EyeIcon className="size-4" />
                        Learner preview
                      </Link>
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </section>
      ) : (
        <section className={`rounded-lg border border-dashed p-8 text-center ${glassCardClassName}`}>
          <h2 className="text-xl font-semibold tracking-tight">No courses match this view</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {courses.length === 0
              ? "Create the first production course draft for this instructor account."
              : "Clear the search or change the workflow filter to see other courses."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {courses.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/instructor/courses/new">
                <PlusIcon className="size-4" />
                Create course
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
