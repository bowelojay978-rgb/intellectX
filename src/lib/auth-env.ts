type PublicAuthEnv = Partial<Record<"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | "NEXT_PUBLIC_CONVEX_URL", string>>;

export type AuthEnvironmentMode = "local-fallback" | "clerk-only" | "convex-only" | "clerk-convex-ready";

type RuntimeAuthEnv = PublicAuthEnv & { NODE_ENV?: string };

export type AuthEnvironmentStatus = {
  clerkPublishableKeyPresent: boolean;
  convexUrlPresent: boolean;
  mode: AuthEnvironmentMode;
  usesLocalFallbackGuard: boolean;
  usesClerkGuard: boolean;
  canRunConvexSync: boolean;
  canRunLocalToAuthMigration: boolean;
  awaitingConvexAuthConfig: boolean;
};

export function getAuthEnvironmentStatus(
  env: RuntimeAuthEnv = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
): AuthEnvironmentStatus {
  const clerkPublishableKeyPresent = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const convexUrlPresent = Boolean(env.NEXT_PUBLIC_CONVEX_URL);
  const mode: AuthEnvironmentMode = clerkPublishableKeyPresent
    ? convexUrlPresent
      ? "clerk-convex-ready"
      : "clerk-only"
    : convexUrlPresent
      ? "convex-only"
      : "local-fallback";

  if (env.NODE_ENV === "production" && mode !== "clerk-convex-ready") {
    throw new Error("Production authentication requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL.");
  }

  return {
    clerkPublishableKeyPresent,
    convexUrlPresent,
    mode,
    usesLocalFallbackGuard: !clerkPublishableKeyPresent,
    usesClerkGuard: clerkPublishableKeyPresent,
    canRunConvexSync: convexUrlPresent,
    canRunLocalToAuthMigration: clerkPublishableKeyPresent && convexUrlPresent,
    // Source auth config already exists in convex/auth.config.ts. This browser-facing helper cannot prove
    // server-side issuer configuration or deployment state; those remain separate production verification gates.
    awaitingConvexAuthConfig: false,
  };
}

export function isClerkAuthEnabled() {
  return getAuthEnvironmentStatus().clerkPublishableKeyPresent;
}
