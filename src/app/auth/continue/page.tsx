import { resolvePostLoginRouteFromClaims } from "@/lib/post-login-route";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContinueAfterLoginPage() {
  let authState: Awaited<ReturnType<typeof auth>> | null = null;

  try {
    authState = await auth();
  } catch {
    // Auth configuration failures must not grant access or infer a role.
  }

  if (!authState?.isAuthenticated) {
    redirect("/login");
  }

  redirect(resolvePostLoginRouteFromClaims(authState.sessionClaims));
}
