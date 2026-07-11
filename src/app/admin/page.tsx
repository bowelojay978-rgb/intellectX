import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - IntellectX",
  description: "Review course submissions, inspect instructor activity, and manage the IntellectX admin workspace frontend.",
};

export default function AdminPage() {
  return (
    <StaffRouteGuard pathname="/admin">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Admin workspace
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Review quality, support instructors, and oversee learning content
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Track the current review queue, inspect instructor activity, and move into focused admin decisions from one workspace.
          </p>
        </section>
        <AdminDashboard />
      </PageShell>
    </StaffRouteGuard>
  );
}
