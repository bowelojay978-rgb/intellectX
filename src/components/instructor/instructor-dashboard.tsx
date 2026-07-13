"use client";

import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { useInstructorCourses } from "@/components/instructor/use-instructor-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convexEnv } from "@/lib/education-data";
import {
  CHANGES_REQUESTED,
  DRAFT,
  PUBLISHED,
  SUBMITTED_FOR_REVIEW,
  formatInstructorWorkspaceDate,
  instructorCourseStatusLabels,
  instructorCourseStatusTone,
  resolveInstructorCourseStatus,
} from "@/lib/instructor-course-workspace";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BookOpenCheckIcon,
  BookOpenIcon,
  CircleDashedIcon,
  Clock3Icon,
  PlusIcon,
  RefreshCcwIcon,
} from "lucide-react";
import Link from "next/link";

function WorkspaceUnavailable() {
  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircleIcon className="text-muted-foreground size-8" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Instructor data is unavailable</h2>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
            NEXT_PUBLIC_CONVEX_URL must be configured before the production instructor workspace can load or save data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstructorDashboard() {
  if (!convexEnv.isConfigured) {
    return <WorkspaceUnavailable />;
  }

  return <ConvexInstructorDashboard />;
}

function ConvexInstructorDashboard() {
  const { courses, loading, error, reload } = useInstructorCourses();

  if (loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading instructor workspace…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircleIcon className="size-7 text-rose-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Unable to load instructor workspace</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              {error}. Confirm the authenticated Clerk session exposes a trusted instructor or admin role to Convex.
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

  const draftCount = courses.filter((course) => {
    const status = resolveInstructorCourseStatus(course);
    return status === DRAFT || status === CHANGES_REQUESTED;
  }).length;
  const reviewCount = courses.filter((course) => resolveInstructorCourseStatus(course) === SUBMITTED_FOR_REVIEW).length;
  const publishedCount = courses.filter((course) => resolveInstructorCourseStatus(course) === PUBLISHED).length;
  const recentCourses = courses.slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{courses.length}</p>
            <p className="text-muted-foreground text-sm">Total courses</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <CircleDashedIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{draftCount}</p>
            <p className="text-muted-foreground text-sm">Editable drafts</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <Clock3Icon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{reviewCount}</p>
            <p className="text-muted-foreground text-sm">Under review</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{publishedCount}</p>
            <p className="text-muted-foreground text-sm">Published</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Recent course activity</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">Live course data from your authenticated Convex workspace.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentCourses.length > 0 ? (
              recentCourses.map((course) => {
                const status = resolveInstructorCourseStatus(course);

                return (
                  <Link
                    key={course.stableId}
                    href={`/instructor/courses/new?edit=${encodeURIComponent(course.stableId)}`}
                    className={`bg-secondary/40 hover:bg-secondary flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${clickableGlassCardClassName}`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{course.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${instructorCourseStatusTone[status]}`}>
                          {instructorCourseStatusLabels[status]}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {course.subject} · {course.lessonCount} lessons · {course.quizCount} quizzes
                      </p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-sm">
                      Updated {formatInstructorWorkspaceDate(course.updatedAt)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">No instructor courses yet</p>
                <p className="text-muted-foreground mt-2 text-sm">Create the first real course draft for this account.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild>
                <Link href="/instructor/courses/new">
                  <PlusIcon className="size-4" />
                  Create course
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/instructor/courses">
                  Manage courses
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Workspace status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6">
              <Badge variant="secondary">Backend connected</Badge>
              <p className="text-muted-foreground">
                Course drafts, lessons, quizzes, questions, workflow state, and review submission are stored in Convex and authorized by trusted staff identity.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
