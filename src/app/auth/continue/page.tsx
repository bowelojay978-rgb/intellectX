import { ClerkSessionContinuation } from "@/components/auth/clerk-session-continuation";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ContinueAfterLoginPage() {
  if (!isClerkAuthEnabled()) {
    redirect("/login");
  }

  return <ClerkSessionContinuation />;
}
