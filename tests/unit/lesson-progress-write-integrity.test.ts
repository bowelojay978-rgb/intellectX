import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMPLETED,
  IN_PROGRESS,
  normalizeLessonProgressWrite,
} from "../../convex/lib/lessonProgressPolicy";

describe("lesson progress write integrity", () => {
  it("derives in-progress versus completed status from authoritative merged progress", () => {
    expect(
      normalizeLessonProgressWrite({
        requestedStatus: IN_PROGRESS,
        requestedProgress: 25,
      }),
    ).toEqual({
      status: IN_PROGRESS,
      progress: 25,
    });

    expect(
      normalizeLessonProgressWrite({
        requestedStatus: IN_PROGRESS,
        requestedProgress: 100,
      }),
    ).toEqual({
      status: COMPLETED,
      progress: 100,
    });
  });

  it("never regresses existing progress", () => {
    expect(
      normalizeLessonProgressWrite({
        requestedStatus: IN_PROGRESS,
        requestedProgress: 25,
        existingProgress: 80,
      }),
    ).toEqual({
      status: IN_PROGRESS,
      progress: 80,
    });

    expect(
      normalizeLessonProgressWrite({
        requestedStatus: IN_PROGRESS,
        requestedProgress: 25,
        existingProgress: 100,
      }),
    ).toEqual({
      status: COMPLETED,
      progress: 100,
    });
  });

  it("rejects inconsistent completed writes below 100 percent", () => {
    expect(() =>
      normalizeLessonProgressWrite({
        requestedStatus: COMPLETED,
        requestedProgress: 99,
      }),
    ).toThrow("Completed lesson progress must be 100 percent.");
  });

  it("clamps numeric progress safely", () => {
    expect(
      normalizeLessonProgressWrite({
        requestedStatus: IN_PROGRESS,
        requestedProgress: -10,
      }),
    ).toEqual({
      status: IN_PROGRESS,
      progress: 0,
    });

    expect(
      normalizeLessonProgressWrite({
        requestedStatus: COMPLETED,
        requestedProgress: 120,
      }),
    ).toEqual({
      status: COMPLETED,
      progress: 100,
    });
  });

  it("requires a learner-visible lesson and uses the compound user-plus-lesson index", () => {
    const lessonsSource = readFileSync(path.resolve(process.cwd(), "convex/lessons.ts"), "utf8");
    const schemaSource = readFileSync(path.resolve(process.cwd(), "convex/schema.ts"), "utf8");

    expect(lessonsSource).toContain("getLearnerVisibleLessonByStableId(ctx, args.lessonId)");
    expect(lessonsSource).toContain("Lesson not found or unavailable to this learner.");
    expect(lessonsSource).toContain('.withIndex("by_user_lesson"');
    expect(schemaSource).toContain('.index("by_user_lesson", ["userKey", "lessonId"])');
  });
});
