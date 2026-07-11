import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminCourseReviews, adminInstructors, getAdminInstructor } from "@/lib/admin-ui-data";
import { instructorWorkspaceCourses } from "@/lib/instructor-ui-data";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  ClipboardCheckIcon,
  Clock3Icon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminDashboard() {
  const activeInstructors = adminInstructors.filter((instructor) => instructor.status === "active").length;
  const publishedCourses = instructorWorkspaceCourses.filter((course) => course.status === "published").length;
  const pendingInstructors = adminInstructors.filter((instructor) => instructor.status === "pending").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <ClipboardCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{adminCourseReviews.length}</p>
            <p className="text-muted-foreground text-sm">Courses awaiting review</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <UsersIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{adminInstructors.length}</p>
            <p className="text-muted-foreground text-sm">Total instructors</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <UserCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{activeInstructors}</p>
            <p className="text-muted-foreground text-sm">Active instructors</p>
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{publishedCourses}</p>
            <p className="text-muted-foreground text-sm">Published courses</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Course review queue</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">Courses that need an admin decision.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/course-review">Open queue</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {adminCourseReviews.length > 0 ? (
              adminCourseReviews.map((review) => {
                const instructor = getAdminInstructor(review.instructorId);

                return (
                  <Link
                    key={review.id}
                    href={`/admin/course-review?review=${review.id}`}
                    className={`bg-secondary/40 hover:bg-secondary flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${clickableGlassCardClassName}`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{review.course.title}</p>
                        {review.priority === "high" ? <Badge variant="secondary">High priority</Badge> : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {instructor?.name ?? "Instructor"} · {review.course.lessons.length} lessons · {review.course.quizzes.length} quizzes
                      </p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-sm">Submitted {formatDate(review.submittedAt)}</p>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No course reviews are waiting right now.
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
                <Link href="/admin/course-review">
                  <ClipboardCheckIcon className="size-4" />
                  Review courses
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/instructors">
                  Manage instructors
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Attention needed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6">
              <div className="flex items-start gap-3">
                <Clock3Icon className="mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground">
                  {adminCourseReviews.length} course{adminCourseReviews.length === 1 ? "" : "s"} waiting for review.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground">
                  {pendingInstructors} instructor application{pendingInstructors === 1 ? "" : "s"} pending frontend review.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Workspace status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6">
              <Badge variant="secondary">Frontend only</Badge>
              <p className="text-muted-foreground">
                Admin decisions on this branch are interactive previews. They are not connected to backend persistence or production mutations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
