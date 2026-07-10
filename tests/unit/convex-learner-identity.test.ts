import { describe, expect, it } from "vitest";

import {
  AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
  resolveConvexLearnerArgs,
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
      isAuthenticatedCall: false,
    });
  });

  it("returns local userKey args for local fallback sync", () => {
    expect(
      resolveConvexLearnerArgs({
        authEnvironment: authEnvironment({ mode: "convex-only", canRunConvexSync: true }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toEqual({ userKey: "learner:local@example.com" });
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

  it("uses authenticated Convex identity when Clerk and Convex are both configured even if local state exists", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: { userKey: "learner:migrating@example.com" },
        isAuthenticated: true,
      }),
    ).toEqual({
      source: "authenticated-convex",
      isAuthenticatedCall: true,
    });
  });

  it("allows Clerk and Convex mode to call Convex functions without a local learner key", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: null,
        isAuthenticated: true,
      }),
    ).toEqual({
      source: "authenticated-convex",
      isAuthenticatedCall: true,
    });

    expect(
      resolveConvexLearnerArgs({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: null,
        isAuthenticated: true,
      }),
    ).toEqual({});
  });

  it("omits stale local learner keys from normal Clerk and Convex calls", () => {
    expect(
      resolveConvexLearnerArgs({
        authEnvironment: authEnvironment({ mode: "clerk-convex-ready", canRunConvexSync: true }),
        localIdentity: { userKey: "learner:stale@example.com" },
        isAuthenticated: true,
      }),
    ).toEqual({});
  });

  it("does not produce a user key when Convex sync is unavailable", () => {
    expect(
      resolveConvexLearnerIdentity({
        authEnvironment: authEnvironment({ mode: "clerk-only", canRunConvexSync: false }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toBeNull();

    expect(
      resolveConvexLearnerArgs({
        authEnvironment: authEnvironment({ mode: "clerk-only", canRunConvexSync: false }),
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toBeNull();
  });

  it("keeps the old placeholder only as a migration rejection sentinel", () => {
    expect(AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER).toBe("auth:convex-authenticated-user");
  });
});
