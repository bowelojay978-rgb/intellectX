"use client";

import { getAuthEnvironmentStatus, type AuthEnvironmentStatus } from "@/lib/auth-env";
import { getCurrentLearnerIdentity, type LearnerIdentity } from "@/lib/learner-session";

export const AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER = "auth:convex-authenticated-user";

type ConvexLearnerIdentitySource = "local-session" | "authenticated-convex-placeholder";

export type ConvexLearnerIdentity = {
  userKey: string;
  source: ConvexLearnerIdentitySource;
  isPlaceholder: boolean;
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
      isPlaceholder: false,
    };
  }

  if (authEnvironment.mode === "clerk-convex-ready") {
    return {
      // Existing Convex functions still accept a userKey argument. Once Convex
      // auth.config.ts is active, authenticated server identity wins over this
      // client placeholder in convex/lib/identity.ts.
      userKey: AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
      source: "authenticated-convex-placeholder",
      isPlaceholder: true,
    };
  }

  return null;
}

export function getCurrentConvexLearnerIdentity() {
  return resolveConvexLearnerIdentity({
    authEnvironment: getAuthEnvironmentStatus(),
    localIdentity: getCurrentLearnerIdentity(),
  });
}
