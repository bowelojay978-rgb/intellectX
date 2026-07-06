import type { UserIdentity } from "convex/server";
import { describe, expect, it } from "vitest";

import { resolveLearnerUserKeyFromIdentity } from "../../convex/lib/identity";
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
    ...overrides,
  };
}

describe("Convex learner identity resolution", () => {
  it("prefers authenticated identity over client-supplied userKey", () => {
    expect(resolveLearnerUserKeyFromIdentity(identity(), "learner:spoofed@example.com")).toEqual({
      userKey: "auth:https://clerk.example|user_123",
      source: "authenticated",
    });
  });

  it("allows the temporary local fallback userKey when no authenticated identity exists", () => {
    expect(resolveLearnerUserKeyFromIdentity(null, " learner:local@example.com ")).toEqual({
      userKey: "learner:local@example.com",
      source: "local-fallback",
    });
  });

  it("rejects missing authenticated identity and missing fallback userKey", () => {
    expect(() => resolveLearnerUserKeyFromIdentity(null, null)).toThrow(
      "A learner identity is required for this operation.",
    );
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
