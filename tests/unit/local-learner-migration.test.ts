import { describe, expect, it } from "vitest";

import { AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER } from "@/lib/convex-learner-identity";
import {
  getLocalLearnerMigrationMarkerKey,
  hasCompletedLocalLearnerMigration,
  isLocalLearnerMigrationSourceUserKey,
  readLocalLearnerMigrationMarker,
  resolveLocalLearnerMigrationSource,
  writeLocalLearnerMigrationMarker,
} from "@/lib/local-learner-migration";

function memoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("local learner migration source resolution", () => {
  it("accepts the current browser local learner identity as a migration source", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "learner:local@example.com" },
      }),
    ).toEqual({
      sourceUserKey: "learner:local@example.com",
      markerKey: "intellectx:local-auth-migration:clerk-convex-ready:learner:local@example.com",
    });
  });

  it("accepts a local migration source when it belongs to the authenticated email", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "learner:local@example.com" },
        authenticatedEmail: " LOCAL@example.com ",
      }),
    ).toEqual({
      sourceUserKey: "learner:local@example.com",
      markerKey: "intellectx:local-auth-migration:clerk-convex-ready:learner:local@example.com",
    });
  });

  it("rejects a stale local migration source owned by a different authenticated email", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "learner:previous@example.com" },
        authenticatedEmail: "current@example.com",
      }),
    ).toBeNull();
  });

  it("rejects migration when authenticated ownership matching is required but no email is available", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "learner:local@example.com" },
        authenticatedEmail: null,
      }),
    ).toBeNull();
  });

  it("rejects missing local identity", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: null,
      }),
    ).toBeNull();
  });

  it("rejects authenticated and placeholder source keys", () => {
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "auth:https://clerk.example|user_123" },
      }),
    ).toBeNull();

    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER },
      }),
    ).toBeNull();
  });

  it("rejects malformed local learner keys", () => {
    expect(isLocalLearnerMigrationSourceUserKey("learner:local@example.com")).toBe(true);
    expect(isLocalLearnerMigrationSourceUserKey("learner:not-an-email")).toBe(false);
    expect(
      resolveLocalLearnerMigrationSource({
        authMode: "clerk-convex-ready",
        localIdentity: { userKey: "learner:not-an-email" },
      }),
    ).toBeNull();
  });

  it("stores migration markers per auth mode and source key", () => {
    const storage = memoryStorage();
    const markerKey = getLocalLearnerMigrationMarkerKey("clerk-convex-ready", "learner:local@example.com");

    expect(readLocalLearnerMigrationMarker(markerKey, storage)).toBeNull();

    writeLocalLearnerMigrationMarker(markerKey, "attempted", storage);
    expect(readLocalLearnerMigrationMarker(markerKey, storage)).toBe("attempted");

    writeLocalLearnerMigrationMarker(markerKey, "succeeded", storage);
    expect(readLocalLearnerMigrationMarker(markerKey, storage)).toBe("succeeded");
  });

  it("treats failed and attempted markers as retryable while success suppresses retries", () => {
    const storage = memoryStorage();
    const markerKey = getLocalLearnerMigrationMarkerKey("clerk-convex-ready", "learner:local@example.com");

    writeLocalLearnerMigrationMarker(markerKey, "attempted", storage);
    expect(hasCompletedLocalLearnerMigration(markerKey, storage)).toBe(false);

    writeLocalLearnerMigrationMarker(markerKey, "failed", storage);
    expect(readLocalLearnerMigrationMarker(markerKey, storage)).toBe("failed");
    expect(hasCompletedLocalLearnerMigration(markerKey, storage)).toBe(false);

    writeLocalLearnerMigrationMarker(markerKey, "succeeded", storage);
    expect(hasCompletedLocalLearnerMigration(markerKey, storage)).toBe(true);
  });
});
