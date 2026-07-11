import { describe, expect, it } from "vitest";

import { calculateCourseProgress, getCourseContinueTarget } from "@/lib/course-progress";
import type { LessonProgressHistoryItem } from "@/lib/lesson-progress-history";

function progress(
  lessonId: string,
  value: number,
  status = value >= 100 ? "completed" : "in_progress",
  updatedAt = "2026-07-11T10:00:00.000Z",
): LessonProgressHistoryItem {
  return {
    lessonId,
    status,
    progress: value,
    updatedAt,
  };
}

const lessons = [{ id: "lesson-1" }, { id: "lesson-2" }, { id: "lesson-3" }];

describe("course progression", () => {
  it("returns zero progress and no continue target when a course has no lessons", () => {
    expect(calculateCourseProgress([], [])).toBe(0);
    expect(getCourseContinueTarget([], [])).toBeNull();
  });

  it("starts at the first lesson when there is no activity", () => {
    expect(getCourseContinueTarget(lessons, [])).toEqual({
      lessonId: "lesson-1",
      label: "Start learning",
    });
  });

  it("continues the most recently active incomplete lesson", () => {
    const history = [
      progress("lesson-1", 25, "in_progress", "2026-07-11T09:00:00.000Z"),
      progress("lesson-2", 50, "in_progress", "2026-07-11T11:00:00.000Z"),
    ];

    expect(getCourseContinueTarget(lessons, history)).toEqual({
      lessonId: "lesson-2",
      label: "Continue learning",
    });
  });

  it("moves to the next incomplete lesson after the latest lesson is completed", () => {
    const history = [
      progress("lesson-1", 100, "completed", "2026-07-11T12:00:00.000Z"),
      progress("lesson-3", 20, "in_progress", "2026-07-11T10:00:00.000Z"),
    ];

    expect(getCourseContinueTarget(lessons, history)).toEqual({
      lessonId: "lesson-2",
      label: "Continue learning",
    });
  });

  it("reviews the last lesson after the entire course is completed", () => {
    const history = [
      progress("lesson-1", 100),
      progress("lesson-2", 100),
      progress("lesson-3", 100),
    ];

    expect(getCourseContinueTarget(lessons, history)).toEqual({
      lessonId: "lesson-3",
      label: "Review course",
    });
  });

  it("calculates course progress from actual per-lesson history", () => {
    const history = [progress("lesson-1", 100), progress("lesson-2", 50)];

    expect(calculateCourseProgress(lessons.map((lesson) => lesson.id), history)).toBe(50);
  });
});
