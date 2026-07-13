import { AdminInstructorsWorkspace } from "@/components/admin/admin-instructors-workspace";
import { AdminWorkspaceNav } from "@/components/admin/admin-workspace-nav";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminClerkSession, listAdminManagedUsers } from "@/lib/server-staff-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructors - IntellectX",
  description: "Secure Clerk-backed instructor access management for IntellectX administrators.",
};

export default async function AdminInstructorsPage() {
  const session = await getAdminClerkSession();
  let users = [];
  let loadError: string | null = null;

  if (session) {
    try {
      users = await listAdminManagedUsers();
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Unable to load Clerk users.";
    }
  }

  return (
    <StaffRouteGuard pathname="/admin/instructors">
      <PageShell>
        <AdminWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            Instructor access
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Manage trusted instructors
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Grant or revoke instructor access through server-authorized Clerk metadata changes. Admin accounts remain protected from this surface.
          </p>
        </section>

        {loadError ? (
          <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
            <CardContent className="py-8 text-sm leading-6">
              Unable to load Clerk users: {loadError}
            </CardContent>
          </Card>
        ) : (
          <AdminInstructorsWorkspace users={users} />
        )}
      </PageShell>
    </StaffRouteGuard>
  );
}
