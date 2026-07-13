import { AdminCourseReviewWorkspace } from "@/components/admin/admin-course-review-workspace";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Review - IntellectX",
  description: "Secure admin review and publication workflow for instructor-created IntellectX courses.",
};

type AdminCourseReviewPageProps = {
  searchParams: Promise<{ course?: string }>;
};

export default async function AdminCourseReviewPage({ searchParams }: AdminCourseReviewPageProps) {
  const { course } = await searchParams;

  return (
    <StaffRouteGuard pathname="/admin/course-review">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Admin review
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Review, approve, and publish courses
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Inspect real submitted lesson content, videos, quizzes, questions, and audit history before applying server-authorized workflow decisions.
          </p>
        </section>
        <AdminCourseReviewWorkspace initialCourseStableId={course} />
      </PageShell>
    </StaffRouteGuard>
  );
}
