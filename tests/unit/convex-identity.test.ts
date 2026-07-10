import type { UserIdentity } from "convex/server";
import { describe, expect, it } from "vitest";

import { isLocalUserKeyFallbackAllowed, resolveLearnerUserKeyFromIdentity } from "../../convex/lib/identity";
import {
  AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
  isLocalLearnerMigrationSourceUserKey,
  prepareLearnerDataMigration,
} from "../../convex/lib/migrateLearnerData";

function identity(overrides: Partial<UserIdentity> = {}): UserIdentity {
  return {
    tokenIdentifier: "https://clerk.example|user_123",
    subject: "user_123",
    issuer: "https://clerk.example",
    email: "local@example.com",
    ...overrides,
  };
}

describe("Convex learner identity resolution", () => {
  it("prefers authenticated identity over client-supplied userKey", () => {
    expect(
      resolveLearnerUserKeyFromIdentity(identity(), "learner:spoofed@example.com", {
        NODE_ENV: "production",
        ALLOW_LOCAL_USERKEY_FALLBACK: "false",
      }),
    ).toEqual({
      userKey: "auth:https://clerk.example|user_123",
      source: "authenticated",
    });
  });

  it("allows the temporary local fallback userKey only when explicitly allowed", () => {
    expect(
      resolveLearnerUserKeyFromIdentity(null, " learner:local@example.com ", {
        ALLOW_LOCAL_USERKEY_FALLBACK: "true",
        NODE_ENV: "production",
      }),
    ).toEqual({
      userKey: "learner:local@example.com",
      source: "local-fallback",
    });
  });

  it("allows the temporary local fallback for clearly local development contexts", () => {
    expect(resolveLearnerUserKeyFromIdentity(null, "learner:local@example.com", { NODE_ENV: "development" })).toEqual({
      userKey: "learner:local@example.com",
      source: "local-fallback",
    });

    expect(
      resolveLearnerUserKeyFromIdentity(null, "learner:local@example.com", { CONVEX_DEPLOYMENT: "dev:example" }),
    ).toEqual({
      userKey: "learner:local@example.com",
      source: "local-fallback",
    });
  });

  it("rejects local fallback in production-like contexts without an opt-in flag", () => {
    expect(() =>
      resolveLearnerUserKeyFromIdentity(null, "learner:local@example.com", {
        NODE_ENV: "production",
      }),
    ).toThrow("Authenticated learner identity is required.");

    expect(() =>
      resolveLearnerUserKeyFromIdentity(null, "learner:local@example.com", {
        CONVEX_DEPLOYMENT: "prod:example",
      }),
    ).toThrow("Authenticated learner identity is required.");
  });

  it("does not let a forged client userKey override authenticated identity", () => {
    expect(
      resolveLearnerUserKeyFromIdentity(identity({ tokenIdentifier: "https://clerk.example|user_real" }), "learner:victim@example.com", {
        ALLOW_LOCAL_USERKEY_FALLBACK: "true",
      }),
    ).toEqual({
      userKey: "auth:https://clerk.example|user_real",
      source: "authenticated",
    });
  });

  it("does not let the authenticated placeholder override real authenticated identity", () => {
    expect(
      resolveLearnerUserKeyFromIdentity(
        identity({ tokenIdentifier: "https://clerk.example|user_real" }),
        AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER,
        {
          NODE_ENV: "production",
          ALLOW_LOCAL_USERKEY_FALLBACK: "false",
        },
      ),
    ).toEqual({
      userKey: "auth:https://clerk.example|user_real",
      source: "authenticated",
    });
  });

  it("rejects missing authenticated identity and missing fallback userKey", () => {
    expect(() => resolveLearnerUserKeyFromIdentity(null, null)).toThrow(
      "A learner identity is required for this operation.",
    );
  });

  it("detects when local userKey fallback is allowed", () => {
    expect(isLocalUserKeyFallbackAllowed({ ALLOW_LOCAL_USERKEY_FALLBACK: "true", NODE_ENV: "production" })).toBe(true);
    expect(isLocalUserKeyFallbackAllowed({ ALLOW_LOCAL_USERKEY_FALLBACK: "false", NODE_ENV: "development" })).toBe(false);
    expect(isLocalUserKeyFallbackAllowed({ ALLOW_LOCAL_USERKEY_FALLBACK: "false", CONVEX_DEPLOYMENT: "dev:example" })).toBe(false);
    expect(isLocalUserKeyFallbackAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isLocalUserKeyFallbackAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isLocalUserKeyFallbackAllowed({ NODE_ENV: "test" })).toBe(true);
    expect(isLocalUserKeyFallbackAllowed({ CONVEX_DEPLOYMENT: "dev:example" })).toBe(true);
    expect(isLocalUserKeyFallbackAllowed({ CONVEX_DEPLOYMENT: "prod:example" })).toBe(false);
    expect(isLocalUserKeyFallbackAllowed({})).toBe(false);
  });
});

describe("Convex learner data migration planning", () => {
  it("rejects missing authenticated identity", () => {
    expect(() => prepareLearnerDataMigration(null, "learner:local@example.com")).toThrow(
      "Authenticated Convex identity is required to migrate learner data.",
    );
  });

  it("rejects an empty source userKey", () => {
    expect(() => prepareLearnerDataMigration(identity(), " ")).toThrow(
      "A local learner source userKey is required to migrate learner data.",
    );
  });

  it("rejects identical source and destination user keys", () => {
    expect(() => prepareLearnerDataMigration(identity(), "auth:https://clerk.example|user_123")).toThrow(
      "Learner migration source and destination user keys must be different.",
    );
  });

  it("rejects authenticated source user keys", () => {
    expect(() => prepareLearnerDataMigration(identity(), "auth:https://clerk.example|user_other")).toThrow(
      "Authenticated learner user keys cannot be used as local migration sources.",
    );
  });

  it("rejects the authenticated Convex compatibility placeholder as a source", () => {
    expect(() => prepareLearnerDataMigration(identity(), AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER)).toThrow(
      "The authenticated Convex compatibility placeholder cannot be used as a migration source.",
    );
  });

  it("rejects malformed local source user keys", () => {
    expect(() => prepareLearnerDataMigration(identity(), "learner:not-an-email")).toThrow(
      "Migration source userKey must be a local learner key.",
    );
  });

  it("rejects migration when authenticated identity has no email claim", () => {
    expect(() =>
      prepareLearnerDataMigration(identity({ email: undefined }), "learner:local@example.com"),
    ).toThrow("Authenticated account email is required to migrate local learner data.");
  });

  it("rejects migration from a local learner key owned by another email", () => {
    expect(() => prepareLearnerDataMigration(identity(), "learner:victim@example.com")).toThrow(
      "Migration source must belong to the authenticated account email.",
    );
  });

  it("matches migration ownership case-insensitively after trimming authenticated email", () => {
    expect(
      prepareLearnerDataMigration(identity({ email: "  Local@Example.COM  " }), "learner:local@example.com"),
    ).toEqual({
      sourceUserKey: "learner:local@example.com",
      destinationUserKey: "auth:https://clerk.example|user_123",
    });
  });

  it("always derives the destination userKey from authenticated identity", () => {
    expect(prepareLearnerDataMigration(identity(), "learner:local@example.com")).toEqual({
      sourceUserKey: "learner:local@example.com",
      destinationUserKey: "auth:https://clerk.example|user_123",
    });
  });

  it("recognizes only local learner user keys as migration sources", () => {
    expect(isLocalLearnerMigrationSourceUserKey("learner:local@example.com")).toBe(true);
    expect(isLocalLearnerMigrationSourceUserKey(" learner:local@example.com ")).toBe(true);
    expect(isLocalLearnerMigrationSourceUserKey("learner:not-an-email")).toBe(false);
    expect(isLocalLearnerMigrationSourceUserKey("auth:https://clerk.example|user_123")).toBe(false);
  });
});
