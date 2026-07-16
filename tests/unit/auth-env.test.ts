import { describe, expect, it } from "vitest";

import { getAuthEnvironmentStatus } from "@/lib/auth-env";

describe("auth environment mode detection", () => {
  it("detects local fallback when Clerk and Convex public env are missing", () => {
    expect(getAuthEnvironmentStatus({})).toMatchObject({
      clerkPublishableKeyPresent: false,
      convexUrlPresent: false,
      mode: "local-fallback",
      usesLocalFallbackGuard: true,
      usesClerkGuard: false,
      canRunConvexSync: false,
      canRunLocalToAuthMigration: false,
      awaitingConvexAuthConfig: false,
    });
  });

  it("detects Clerk-only mode without enabling Convex migration", () => {
    expect(getAuthEnvironmentStatus({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example" })).toMatchObject({
      clerkPublishableKeyPresent: true,
      convexUrlPresent: false,
      mode: "clerk-only",
      usesLocalFallbackGuard: false,
      usesClerkGuard: true,
      canRunConvexSync: false,
      canRunLocalToAuthMigration: false,
      awaitingConvexAuthConfig: false,
    });
  });

  it("detects Convex-only mode as local fallback with Convex sync", () => {
    expect(getAuthEnvironmentStatus({ NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud" })).toMatchObject({
      clerkPublishableKeyPresent: false,
      convexUrlPresent: true,
      mode: "convex-only",
      usesLocalFallbackGuard: true,
      usesClerkGuard: false,
      canRunConvexSync: true,
      canRunLocalToAuthMigration: false,
      awaitingConvexAuthConfig: false,
    });
  });

  it("detects Clerk and Convex as frontend-ready without falsely awaiting source auth config", () => {
    expect(
      getAuthEnvironmentStatus({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      }),
    ).toMatchObject({
      clerkPublishableKeyPresent: true,
      convexUrlPresent: true,
      mode: "clerk-convex-ready",
      usesLocalFallbackGuard: false,
      usesClerkGuard: true,
      canRunConvexSync: true,
      canRunLocalToAuthMigration: true,
      awaitingConvexAuthConfig: false,
    });
  });

  it("fails closed in production unless both Clerk and Convex public configuration are present", () => {
    expect(() => getAuthEnvironmentStatus({ NODE_ENV: "production" })).toThrow(
      "Production authentication requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL.",
    );
    expect(() =>
      getAuthEnvironmentStatus({
        NODE_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
      }),
    ).toThrow("Production authentication requires");
    expect(() =>
      getAuthEnvironmentStatus({
        NODE_ENV: "production",
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      }),
    ).toThrow("Production authentication requires");

    expect(
      getAuthEnvironmentStatus({
        NODE_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      }).mode,
    ).toBe("clerk-convex-ready");
  });
});
