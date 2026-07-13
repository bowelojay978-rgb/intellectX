import { beforeEach, describe, expect, it } from "vitest";

import { hydrateAuthenticatedLessonProgressHistory } from "@/lib/authenticated-learner-hydration";
import { calculateCourseProgress } from "@/lib/course-progress";
import {
  readLessonProgressHistory,
  writeLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";

beforeEach(() => {
  localStorage.clear();
});

function lessonProgress(
  lessonId: string,
  progress: number,
  updatedAt: string,
): LessonProgressHistoryItem {
  return {
    lessonId,
    status: progress >= 100 ? "completed" : "in_progress",
    progress,
    updatedAt,
  };
}

describe("lesson progress integrity", () => {
  it("preserves complete per-lesson history beyond the previous 50-item cache limit", () => {
    const items = Array.from({ length: 60 }, (_, index) =>
      lessonProgress(
        `lesson-${index + 1}`,
        100,
        new Date(Date.UTC(2026, 6, 13, 0, index)).toISOString(),
      ),
    );

    writeLessonProgressHistory(items);

    const storedHistory = readLessonProgressHistory();
    expect(storedHistory).toHaveLength(60);
    expect(calculateCourseProgress(items.map((item) => item.lessonId), storedHistory)).toBe(100);
  });

  it("preserves an optimistic local completion recorded after a remote hydration request started", () => {
    const remoteRequestedAt = Date.parse("2026-07-13T10:00:00.000Z");

    writeLessonProgressHistory([
      lessonProgress("lesson-1", 100, "2026-07-13T10:00:01.000Z"),
    ]);

    hydrateAuthenticatedLessonProgressHistory(
      [lessonProgress("lesson-1", 25, "2026-07-13T09:59:00.000Z")],
      false,
      remoteRequestedAt,
    );

    expect(readLessonProgressHistory()).toEqual([
      lessonProgress("lesson-1", 100, "2026-07-13T10:00:01.000Z"),
    ]);
  });

  it("never lets a newer local open event regress an already completed remote lesson", () => {
    const remoteRequestedAt = Date.parse("2026-07-13T10:00:00.000Z");

    writeLessonProgressHistory([
      lessonProgress("lesson-1", 25, "2026-07-13T10:00:01.000Z"),
    ]);

    hydrateAuthenticatedLessonProgressHistory(
      [lessonProgress("lesson-1", 100, "2026-07-13T09:59:00.000Z")],
      false,
      remoteRequestedAt,
    );

    const [progress] = readLessonProgressHistory();
    expect(progress.progress).toBe(100);
    expect(progress.status).toBe("completed");
  });

  it("still clears stale pre-request local lesson history when authenticated remote history is empty", () => {
    const remoteRequestedAt = Date.parse("2026-07-13T10:00:00.000Z");

    writeLessonProgressHistory([
      lessonProgress("lesson-stale", 100, "2026-07-13T09:00:00.000Z"),
    ]);

    hydrateAuthenticatedLessonProgressHistory([], false, remoteRequestedAt);

    expect(readLessonProgressHistory()).toEqual([]);
  });
});
