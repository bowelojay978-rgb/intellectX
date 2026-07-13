import { describe, expect, it } from "vitest";

import { mergeStudyStatsSnapshot } from "../../convex/lib/studyStats";

describe("study stats monotonicity", () => {
  it("accepts a newer activity snapshot while preserving the longest streak", () => {
    expect(
      mergeStudyStatsSnapshot(
        {
          currentStreak: 3,
          longestStreak: 10,
          weeklyActiveDays: ["Mon"],
          lastStudiedDate: "2026-07-10T10:00:00.000Z",
        },
        {
          currentStreak: 4,
          longestStreak: 4,
          weeklyActiveDays: ["Mon", "Tue", "Tue"],
          lastStudiedDate: "2026-07-11T10:00:00.000Z",
        },
      ),
    ).toEqual({
      currentStreak: 4,
      longestStreak: 10,
      weeklyActiveDays: ["Mon", "Tue"],
      lastStudiedDate: "2026-07-11T10:00:00.000Z",
    });
  });

  it("does not let an older stale snapshot overwrite newer learner activity", () => {
    expect(
      mergeStudyStatsSnapshot(
        {
          currentStreak: 12,
          longestStreak: 20,
          weeklyActiveDays: ["Mon", "Tue", "Wed"],
          lastStudiedDate: "2026-07-13T10:00:00.000Z",
        },
        {
          currentStreak: 2,
          longestStreak: 25,
          weeklyActiveDays: ["Mon"],
          lastStudiedDate: "2026-07-11T10:00:00.000Z",
        },
      ),
    ).toEqual({
      currentStreak: 12,
      longestStreak: 25,
      weeklyActiveDays: ["Mon", "Tue", "Wed"],
      lastStudiedDate: "2026-07-13T10:00:00.000Z",
    });
  });

  it("allows same-activity-date streak recalculation without losing the longest streak", () => {
    expect(
      mergeStudyStatsSnapshot(
        {
          currentStreak: 5,
          longestStreak: 8,
          weeklyActiveDays: ["Mon", "Tue"],
          lastStudiedDate: "2026-07-10T10:00:00.000Z",
        },
        {
          currentStreak: 0,
          longestStreak: 0,
          weeklyActiveDays: [],
          lastStudiedDate: "2026-07-10T10:00:00.000Z",
        },
      ),
    ).toEqual({
      currentStreak: 0,
      longestStreak: 8,
      weeklyActiveDays: [],
      lastStudiedDate: "2026-07-10T10:00:00.000Z",
    });
  });

  it("rejects an invalid incoming study date instead of corrupting ordering", () => {
    expect(() =>
      mergeStudyStatsSnapshot(null, {
        currentStreak: 1,
        longestStreak: 1,
        weeklyActiveDays: ["Mon"],
        lastStudiedDate: "not-a-date",
      }),
    ).toThrow("Study stats lastStudiedDate must be a valid date.");
  });
});
