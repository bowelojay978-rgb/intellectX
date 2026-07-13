import { setInstructorAccessAction } from "@/app/admin/instructors/actions";
import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminManagedUser } from "@/lib/server-staff-auth";
import { ShieldCheckIcon, UserRoundCheckIcon, UsersIcon } from "lucide-react";

function formatDate(value: number | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminInstructorsWorkspace({ users }: { users: AdminManagedUser[] }) {
  const instructorCount = users.filter((user) => user.role === "instructor").length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Clerk users" value={users.length} icon={<UsersIcon className="size-5" />} />
        <MetricCard label="Instructors" value={instructorCount} icon={<UserRoundCheckIcon className="size-5" />} />
        <MetricCard label="Admins" value={adminCount} icon={<ShieldCheckIcon className="size-5" />} />
      </section>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Instructor access</CardTitle>
          <p className="text-muted-foreground text-sm leading-6">
            Promote learners to instructor or revoke instructor access. Role changes are written to trusted Clerk public metadata from a server-authorized admin action; admin accounts cannot be changed here.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-lg border border-border/70 bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={user.role === "admin" ? "default" : user.role === "instructor" ? "secondary" : "outline"}>
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-sm">{user.email}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Joined {formatDate(user.createdAt)} · Last sign-in {formatDate(user.lastSignInAt)}
                  </p>
                </div>

                {user.role === "admin" ? (
                  <p className="text-muted-foreground text-sm">Protected admin account</p>
                ) : (
                  <form action={setInstructorAccessAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="role" value={user.role === "instructor" ? "learner" : "instructor"} />
                    <Button type="submit" variant={user.role === "instructor" ? "outline" : "default"}>
                      {user.role === "instructor" ? "Revoke instructor access" : "Grant instructor access"}
                    </Button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No Clerk users are available to manage.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="bg-secondary/60 rounded-lg p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}
