import { describe, expect, it } from "vitest";

import {
  AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
  resolveConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import type { AuthEnvironmentStatus } from "@/lib/auth-env";

function authEnvironment(
  overrides: Pick<AuthEnvironmentStatus, "mode" | "canRunConvexSync">,
): Pick<AuthEnvironmentStatus, "mode" | "canRunConvexSync"> {
  return overrides;
}

describe("frontend Convex learner identity resolution", () => {
  it("uses a local learner key for Convex-only local fallback sync", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "convex-only", canRunConvexSync: true }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toEqual({
      userKey: "learner:local@example.com",
      source: "local-session",
      isPlaceholder: false,
    });
  });

  it("does not allow local fallback Convex sync without a local learner key", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "convex-only", canRunConvexSync: true }),
        localIdentity: null,
      }),
    ).toBeNull();
  });

  it("does not produce a write identity in local fallback mode when Convex sync is unavailable", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "local-fallback", canRunConvexSync: false }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toBeNull();
  });

  it("does not produce a write identity in Clerk-only mode without Convex sync", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-only", canRunConvexSync: false }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toBeNull();
  });

  it("keeps a local learner key as the temporary fallback when Clerk and Convex are both configured", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: { userKey: "learner:migrating@example.com" },
      }),
    ).toEqual({
      userKey: "learner:migrating@example.com",
      source: "local-session",
      isPlaceholder: false,
    });
  });

  it("allows Clerk and Convex mode to call existing Convex functions without a local learner key", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: null,
      }),
    ).toEqual({
      userKey: AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
      source: "authenticated-convex-placeholder",
      isPlaceholder: true,
    });
  });

  it("does not produce a user key when Convex sync is unavailable", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-only", canRunConvexSync: false }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toBeNull();
  });
});
