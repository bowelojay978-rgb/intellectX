import { AdminInstructorsWorkspace } from "@/components/admin/admin-instructors-workspace";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructors - IntellectX",
  description: "Search instructors, inspect activity, and preview frontend-only admin account actions.",
};

export default function AdminInstructorsPage() {
  return (
    <StaffRouteGuard pathname="/admin/instructors">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Instructor management
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Inspect instructors and manage account states from one directory
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Search by name, email, or subject, inspect instructor activity, and preview approval or access-state actions without backend changes.
          </p>
        </section>
        <AdminInstructorsWorkspace />
      </PageShell>
    </StaffRouteGuard>
  );
}
