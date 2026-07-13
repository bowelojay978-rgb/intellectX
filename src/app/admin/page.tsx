import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - IntellectX",
  description: "Secure IntellectX administration for course review, publication workflow, and instructor access.",
};

export default function AdminPage() {
  return (
    <StaffRouteGuard pathname="/admin">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">Admin</Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Course workflow control center
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Review submitted instructor courses, control publication state, inspect workflow evidence, and manage instructor access through trusted server-authorized operations.
          </p>
        </section>
        <AdminDashboard />
      </PageShell>
    </StaffRouteGuard>
  );
}
