import { AdminCourseReviewWorkspace } from "@/components/admin/admin-course-review-workspace";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Course Review - IntellectX",
  description: "Inspect course submissions, review readiness, and record frontend-only admin decisions.",
};

export default function AdminCourseReviewPage() {
  return (
    <StaffRouteGuard pathname="/admin/course-review">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Course review
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Inspect course quality before content reaches learners
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Review course structure, lessons, quizzes, readiness checks, and instructor feedback from one focused queue.
          </p>
        </section>
        <Suspense fallback={<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Loading review workspace…</div>}>
          <AdminCourseReviewWorkspace />
        </Suspense>
      </PageShell>
    </StaffRouteGuard>
  );
}
