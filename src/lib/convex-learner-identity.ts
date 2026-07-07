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
};

export function resolveConvexLearnerIdentity({
  authEnvironment,
  localIdentity,
}: ResolveConvexLearnerIdentityArgs): ConvexLearnerIdentity | null {
  if (!authEnvironment.canRunConvexSync) {
    return null;
  }

  if (localIdentity?.userKey) {
    return {
      userKey: localIdentity.userKey,
      source: "local-session",
      isAuthenticatedCall: false,
    };
  }

  if (authEnvironment.mode === "clerk-convex-ready") {
    return {
      source: "authenticated-convex",
      isAuthenticatedCall: true,
    };
  }

  return null;
}

export function resolveConvexLearnerArgs({
  authEnvironment,
  localIdentity,
}: ResolveConvexLearnerIdentityArgs): ConvexLearnerArgs | null {
  const identity = resolveConvexLearnerIdentity({ authEnvironment, localIdentity });

  if (!identity) {
    return null;
  }

  return identity.userKey ? { userKey: identity.userKey } : {};
}

export function getCurrentConvexLearnerIdentity() {
  return resolveConvexLearnerIdentity({
    authEnvironment: getAuthEnvironmentStatus(),
    localIdentity: getCurrentLearnerIdentity(),
  });
}

export function getCurrentConvexLearnerArgs() {
  return resolveConvexLearnerArgs({
    authEnvironment: getAuthEnvironmentStatus(),
    localIdentity: getCurrentLearnerIdentity(),
  });
}
