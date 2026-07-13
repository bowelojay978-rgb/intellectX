import { beforeEach, describe, expect, it } from "vitest";

import {
  hasPendingLocalLearnerMigrationSource,
  shouldClearAuthenticatedLearnerLocalDataForTransition,
} from "@/lib/authenticated-learner-local-data";
import { createLearnerSession } from "@/lib/learner-session";

beforeEach(() => {
  localStorage.clear();
});

describe("authenticated learner email isolation", () => {
  it("preserves a pending local migration source only for the matching authenticated email", () => {
    createLearnerSession({
      name: "Local learner",
      email: "local@example.com",
      role: "student",
    });

    expect(
      hasPendingLocalLearnerMigrationSource({
        authenticatedEmail: " LOCAL@example.com ",
      }),
    ).toBe(true);
  });

  it("does not let a stale local learner from another email suppress account-switch cleanup", () => {
    createLearnerSession({
      name: "Previous learner",
      email: "previous@example.com",
      role: "student",
    });

    const hasMigrationSource = hasPendingLocalLearnerMigrationSource({
      authenticatedEmail: "current@example.com",
    });

    expect(hasMigrationSource).toBe(false);
    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: "user_previous",
        nextUserId: "user_current",
        hasMigrationSource,
      }),
    ).toBe(true);
  });

  it("fails closed when authenticated email ownership cannot be established", () => {
    createLearnerSession({
      name: "Local learner",
      email: "local@example.com",
      role: "student",
    });

    expect(
      hasPendingLocalLearnerMigrationSource({
        authenticatedEmail: null,
      }),
    ).toBe(false);
  });
});
