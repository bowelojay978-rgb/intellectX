"use client";

import { getAuthEnvironmentStatus, type AuthEnvironmentStatus } from "@/lib/auth-env";
import { getCurrentLearnerIdentity, type LearnerIdentity } from "@/lib/learner-session";

export const AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER = "auth:convex-authenticated-user";

type ConvexLearnerIdentitySource = "local-session" | "authenticated-convex";

export type ConvexLearnerIdentity = {
  userKey?: string;
  source: ConvexLearnerIdentitySource;
  isAuthenticatedCall: boolean;
};

export type ConvexLearnerArgs = {
  userKey?: string;
};

type ResolveConvexLearnerIdentityArgs = {
  authEnvironment: Pick<AuthEnvironmentStatus, "mode" | "canRunConvexSync">;
  localIdentity?: Pick<LearnerIdentity, "userKey"> | null;
  // Explicit client auth readiness (from Clerk runtime). When `undefined` on
  // the server (no `window`), server-side code may assume auth as configured.
  isAuthenticated?: boolean | undefined;
};

export function resolveConvexLearnerIdentity({
  authEnvironment,
  localIdentity,
  isAuthenticated,
}: ResolveConvexLearnerIdentityArgs): ConvexLearnerIdentity | null {
  if (!authEnvironment.canRunConvexSync) {
    return null;
  }

  if (authEnvironment.mode === "clerk-convex-ready") {
    // Server-side: preserve previous behaviour where server-side auth is
    // authoritative and there is no `window` to inspect.
    if (typeof window === "undefined") {
      return {
        source: "authenticated-convex",
        isAuthenticatedCall: true,
      };
    }

    // Client-side: require explicit auth readiness from the auth runtime
    // (e.g., Clerk's `useAuth()` -> isLoaded && isSignedIn). Do NOT rely on
    // localStorage markers as proof of authentication.
    if (!isAuthenticated) {
      return null;
    }

    return {
      source: "authenticated-convex",
      isAuthenticatedCall: true,
    };
  }

  if (localIdentity?.userKey) {
    return {
      userKey: localIdentity.userKey,
      source: "local-session",
      isAuthenticatedCall: false,
    };
  }

  return null;
}

export function resolveConvexLearnerArgs({
  authEnvironment,
  localIdentity,
  isAuthenticated,
}: ResolveConvexLearnerIdentityArgs): ConvexLearnerArgs | null {
  const identity = resolveConvexLearnerIdentity({ authEnvironment, localIdentity, isAuthenticated });

  if (!identity) {
    return null;
  }

  return identity.userKey ? { userKey: identity.userKey } : {};
}

export function getCurrentConvexLearnerIdentity(isAuthenticated?: boolean) {
  return resolveConvexLearnerIdentity({
    authEnvironment: getAuthEnvironmentStatus(),
    localIdentity: getCurrentLearnerIdentity(),
    isAuthenticated,
  });
}

export function getCurrentConvexLearnerArgs(isAuthenticated?: boolean) {
  return resolveConvexLearnerArgs({
    authEnvironment: getAuthEnvironmentStatus(),
    localIdentity: getCurrentLearnerIdentity(),
    isAuthenticated,
  });
}
