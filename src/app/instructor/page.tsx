import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { InstructorDashboard } from "@/components/instructor/instructor-dashboard";
import { InstructorWorkspaceNav } from "@/components/instructor/instructor-workspace-nav";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructor - IntellectX",
  description: "Secure instructor workspace for creating courses, managing content, and submitting drafts for review.",
};

export default function InstructorPage() {
  return (
    <StaffRouteGuard pathname="/instructor">
      <PageShell>
        <InstructorWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Instructor workspace
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Build and manage focused learning experiences
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Create course drafts, manage lessons and quizzes, track review status, and submit complete courses to admins from one authenticated workspace.
          </p>
        </section>
        <InstructorDashboard />
      </PageShell>
    </StaffRouteGuard>
  );
}
