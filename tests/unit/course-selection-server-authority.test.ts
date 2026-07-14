import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  COURSE_SELECTION_GRACE_PERIOD_MS,
  COURSE_SELECTION_LIMIT,
  buildAuthoritativeCourseSelectionWrite,
  deriveAuthoritativeCourseSelectionState,
  normalizeRequestedCourseSelectionIds,
} from "../../convex/lib/courseSelectionPolicy";

function existingSelection(overrides: Record<string, unknown> = {}) {
  return {
    selectedCourseIds: ["course-a"],
    selectedAt: 1,
    gracePeriodEndsAt: 2,
    lockedAt: null,
    locked: false,
    _creationTime: 1_000,
    ...overrides,
  };
}

describe("server-authoritative course selection policy", () => {
  it("enforces the real five-course limit and rejects duplicates", () => {
    expect(COURSE_SELECTION_LIMIT).toBe(5);
    expect(normalizeRequestedCourseSelectionIds(["a", "b", "c", "d", "e"])).toHaveLength(5);
    expect(() => normalizeRequestedCourseSelectionIds(["a", "b", "c", "d", "e", "f"])).toThrow(
      "up to 5 courses",
    );
    expect(() => normalizeRequestedCourseSelectionIds(["a", "a"])).toThrow("duplicate course IDs");
  });

  it("starts the seven-day grace period from server time for the first non-empty selection", () => {
    const now = 50_000;
    const result = buildAuthoritativeCourseSelectionWrite({
      existing: null,
      requestedCourseIds: ["course-a"],
      now,
    });

    expect(result).toEqual({
      selectedCourseIds: ["course-a"],
      selectedAt: now,
      gracePeriodEndsAt: now + COURSE_SELECTION_GRACE_PERIOD_MS,
      lockedAt: null,
      locked: false,
    });
  });

  it("does not create a server selection for an empty first write", () => {
    expect(
      buildAuthoritativeCourseSelectionWrite({
        existing: null,
        requestedCourseIds: [],
        now: 50_000,
      }),
    ).toBeNull();
  });

  it("uses trusted record creation time instead of client-supplied timestamps and lock flags", () => {
    const result = deriveAuthoritativeCourseSelectionState(
      existingSelection({
        selectedAt: 999_999_999,
        gracePeriodEndsAt: 999_999_999,
        lockedAt: 999,
        locked: true,
      }),
      2_000,
    );

    expect(result.selectedAt).toBe(1_000);
    expect(result.gracePeriodEndsAt).toBe(1_000 + COURSE_SELECTION_GRACE_PERIOD_MS);
    expect(result.locked).toBe(false);
    expect(result.lockedAt).toBeNull();
  });

  it("preserves the original grace-period start across edits so clients cannot reset or extend it", () => {
    const now = 10_000;
    const result = buildAuthoritativeCourseSelectionWrite({
      existing: existingSelection(),
      requestedCourseIds: ["course-a", "course-b"],
      now,
    });

    expect(result?.selectedAt).toBe(1_000);
    expect(result?.gracePeriodEndsAt).toBe(1_000 + COURSE_SELECTION_GRACE_PERIOD_MS);
  });

  it("locks at server-derived expiry and rejects changed selections", () => {
    const expiredAt = 1_000 + COURSE_SELECTION_GRACE_PERIOD_MS;

    expect(() =>
      buildAuthoritativeCourseSelectionWrite({
        existing: existingSelection(),
        requestedCourseIds: ["course-b"],
        now: expiredAt,
      }),
    ).toThrow("locked and can no longer be changed");
  });

  it("allows idempotent retries of the same locked selection", () => {
    const expiredAt = 1_000 + COURSE_SELECTION_GRACE_PERIOD_MS;
    const result = buildAuthoritativeCourseSelectionWrite({
      existing: existingSelection(),
      requestedCourseIds: ["course-a"],
      now: expiredAt,
    });

    expect(result).toMatchObject({
      selectedCourseIds: ["course-a"],
      locked: true,
      lockedAt: expiredAt,
      gracePeriodEndsAt: expiredAt,
    });
  });

  it("wires learner visibility checks and ignores client authority fields in the Convex mutation", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/courseSelections.ts"), "utf8");

    expect(source).toContain("isLearnerVisibleCourseRecord");
    expect(source).toContain("learnerCourseVisibilityOptions");
    expect(source).toContain("buildAuthoritativeCourseSelectionWrite");
    expect(source).toContain("deriveAuthoritativeCourseSelectionState(existing, now).locked");
    expect(source).not.toContain("selectedAt: args.selectedAt");
    expect(source).not.toContain("gracePeriodEndsAt: args.gracePeriodEndsAt");
    expect(source).not.toContain("lockedAt: args.lockedAt");
    expect(source).not.toContain("locked: args.locked");
  });
});
