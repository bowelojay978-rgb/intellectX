import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { resolvePostLoginRouteFromClaims } from "@/lib/post-login-route";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login - IntellectX",
  description: "Learner login for IntellectX.",
};

export default async function LoginPage() {
  if (isClerkAuthEnabled()) {
    let authState: Awaited<ReturnType<typeof auth>> | null = null;

    try {
      authState = await auth();
    } catch {
      // Render the fail-closed Clerk login surface when server auth is unavailable.
    }

    if (authState?.isAuthenticated) {
      redirect(resolvePostLoginRouteFromClaims(authState.sessionClaims));
    }
  }

  return <AuthPageShell mode="login" />;
}
