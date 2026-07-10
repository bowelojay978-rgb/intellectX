import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  instructorStatusLabels,
  instructorWorkspaceCourses,
  type InstructorCourseStatus,
} from "@/lib/instructor-ui-data";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  BookOpenIcon,
  CircleDashedIcon,
  Clock3Icon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";

const statusTone: Record<InstructorCourseStatus, string> = {
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  under_review: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function InstructorDashboard() {
  const publishedCount = instructorWorkspaceCourses.filter((course) => course.status === "published").length;
  const draftCount = instructorWorkspaceCourses.filter((course) => course.status === "draft").length;
  const reviewCount = instructorWorkspaceCourses.filter((course) => course.status === "under_review").length;
  const recentCourses = [...instructorWorkspaceCourses]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{instructorWorkspaceCourses.length}</p>
            <p className="text-muted-foreground text-sm">Total courses</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <CircleDashedIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{draftCount}</p>
            <p className="text-muted-foreground text-sm">Draft courses</p>
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
              <p className="text-muted-foreground mt-2 text-sm">Frontend preview data for the instructor workspace.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/instructor/courses/new?edit=${course.id}`}
                className={`bg-secondary/40 hover:bg-secondary flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${clickableGlassCardClassName}`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{course.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[course.status]}`}>
                      {instructorStatusLabels[course.status]}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {course.subject} · {course.lessons.length} lessons · {course.quizzes.length} quizzes
                  </p>
                </div>
                <p className="text-muted-foreground shrink-0 text-sm">Updated {formatUpdatedAt(course.updatedAt)}</p>
              </Link>
            ))}
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
              <Badge variant="secondary">Frontend only</Badge>
              <p className="text-muted-foreground">
                This instructor workspace is interactive, but course changes are not connected to backend persistence yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
