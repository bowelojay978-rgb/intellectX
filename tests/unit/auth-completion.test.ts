import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { requireClerkJwtIssuerDomain } from "../../convex/lib/authConfigPolicy";
import { isLocalUserKeyFallbackAllowed } from "../../convex/lib/identity";

const learnerOwnedModules = [
  "academicProfiles.ts",
  "courseSelections.ts",
  "entitlements.ts",
  "lessons.ts",
  "notes.ts",
  "progress.ts",
  "quizzes.ts",
  "studyStats.ts",
];

describe("authentication completion contract", () => {
  it("normalizes explicit local fallback policy before applying environment defaults", () => {
    expect(
      isLocalUserKeyFallbackAllowed({
        ALLOW_LOCAL_USERKEY_FALLBACK: " false ",
        NODE_ENV: "development",
      }),
    ).toBe(false);

    expect(
      isLocalUserKeyFallbackAllowed({
        ALLOW_LOCAL_USERKEY_FALLBACK: " TRUE ",
        NODE_ENV: "production",
      }),
    ).toBe(true);
  });

  it("requires a valid https Clerk JWT issuer for Convex auth config", () => {
    expect(
      requireClerkJwtIssuerDomain({
        CLERK_JWT_ISSUER_DOMAIN: " https://example.clerk.accounts.dev ",
      }),
    ).toBe("https://example.clerk.accounts.dev");

    expect(() => requireClerkJwtIssuerDomain({})).toThrow(
      "CLERK_JWT_ISSUER_DOMAIN is required for Convex Clerk authentication.",
    );
    expect(() =>
      requireClerkJwtIssuerDomain({ CLERK_JWT_ISSUER_DOMAIN: "not-a-url" }),
    ).toThrow("CLERK_JWT_ISSUER_DOMAIN must be a valid https URL.");
    expect(() =>
      requireClerkJwtIssuerDomain({ CLERK_JWT_ISSUER_DOMAIN: "http://example.com" }),
    ).toThrow("CLERK_JWT_ISSUER_DOMAIN must be a valid https URL.");
  });

  it("keeps Convex auth config bound to the validated Clerk issuer and convex audience", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/auth.config.ts"), "utf8");

    expect(source).toContain("requireClerkJwtIssuerDomain()");
    expect(source).toContain('applicationID: "convex"');
  });

  it("keeps Clerk and Convex wired through ConvexProviderWithClerk", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/providers/convex-client-provider.tsx"),
      "utf8",
    );

    expect(source).toContain("ConvexProviderWithClerk");
    expect(source).toContain("useAuth={useAuth}");
  });

  it("waits for Clerk user data before declaring signed-in auth runtime loaded", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/providers/learner-auth-runtime-provider.tsx"),
      "utf8",
    );

    expect(source).toContain("isAuthLoaded && (!isSignedIn || isUserLoaded)");
    expect(source).toContain("primaryEmailAddress");
  });

  it("keeps every learner-owned Convex module behind the authoritative identity resolver", () => {
    for (const filename of learnerOwnedModules) {
      const source = readFileSync(path.resolve(process.cwd(), "convex", filename), "utf8");
      expect(source, filename).toContain("resolveLearnerUserKey");
    }
  });

  it("provides a safe runtime diagnostic without returning raw identity claims", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/authDiagnostics.ts"), "utf8");

    expect(source).toContain("ctx.auth.getUserIdentity()");
    expect(source).toContain("authenticated: Boolean(identity)");
    expect(source).toContain("hasTokenIdentifier");
    expect(source).toContain("hasSubject");
    expect(source).toContain("hasIssuer");
    expect(source).not.toContain("return identity");
  });
});
