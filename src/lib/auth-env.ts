type PublicAuthEnv = Partial<Record<"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | "NEXT_PUBLIC_CONVEX_URL", string>>;

export type AuthEnvironmentMode =
  | "local-fallback"
  | "clerk-only"
  | "convex-only"
  | "clerk-convex-ready";

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

export function getAuthEnvironmentStatus(env: PublicAuthEnv = process.env as PublicAuthEnv): AuthEnvironmentStatus {
  const clerkPublishableKeyPresent = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const convexUrlPresent = Boolean(env.NEXT_PUBLIC_CONVEX_URL);
  const mode: AuthEnvironmentMode = clerkPublishableKeyPresent
    ? convexUrlPresent
      ? "clerk-convex-ready"
      : "clerk-only"
    : convexUrlPresent
      ? "convex-only"
      : "local-fallback";

  return {
    clerkPublishableKeyPresent,
    convexUrlPresent,
    mode,
    usesLocalFallbackGuard: !clerkPublishableKeyPresent,
    usesClerkGuard: clerkPublishableKeyPresent,
    canRunConvexSync: convexUrlPresent,
    canRunLocalToAuthMigration: clerkPublishableKeyPresent && convexUrlPresent,
    awaitingConvexAuthConfig: clerkPublishableKeyPresent && convexUrlPresent,
  };
}

export function isClerkAuthEnabled() {
  return getAuthEnvironmentStatus().clerkPublishableKeyPresent;
}
