import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveStaffRouteAccess, resolveTrustedStaffRoleFromClaims } from "@/lib/staff-route-runtime-access";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type StaffRouteGuardProps = {
  pathname: string;
  children: React.ReactNode;
};

async function getTrustedStaffRouteAccess(pathname: string) {
  try {
    const authState = await auth();
    const role = authState.isAuthenticated
      ? resolveTrustedStaffRoleFromClaims(authState.sessionClaims)
      : null;

    return resolveStaffRouteAccess(role, pathname);
  } catch {
    // Fail closed when Clerk server auth is unavailable or trusted role claims
    // are not wired yet. Do not replace this with local or client-editable state.
    return resolveStaffRouteAccess(null, pathname);
  }
}

function StaffAccessDenied() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Access denied
        </Badge>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Staff access is locked</h1>
        <p className="text-muted-foreground max-w-xl leading-6 md:text-lg">
          A trusted staff role is required to view this route. Staff placeholders remain unavailable until real RBAC is
          wired to authenticated claims.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/courses">Browse learner courses</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

export async function StaffRouteGuard({ pathname, children }: StaffRouteGuardProps) {
  const access = await getTrustedStaffRouteAccess(pathname);

  if (!access.allowed) {
    return <StaffAccessDenied />;
  }

  return <>{children}</>;
}
