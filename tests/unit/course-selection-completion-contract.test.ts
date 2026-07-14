import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  COURSE_SELECTION_SYNC_RETRY_EVENT,
  COURSE_SELECTION_SYNC_STATUS_EVENT,
  COURSE_SELECTION_LIMIT,
  dispatchCourseSelectionSyncStatus,
  getSelectedCourseIdsOutsideVisibleCourses,
  retryCourseSelectionSync,
} from "@/lib/course-selection";

describe("course selection completion contract", () => {
  it("keeps hidden selected courses identifiable instead of silently losing them from the controls", () => {
    expect(
      getSelectedCourseIdsOutsideVisibleCourses(
        ["ai-study-systems", "exam-accelerator", "removed-course"],
        ["ai-study-systems"],
      ),
    ).toEqual(["exam-accelerator", "removed-course"]);
  });

  it("keeps the learner-facing counter bound to the real five-course product limit", () => {
    expect(COURSE_SELECTION_LIMIT).toBe(5);

    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/convex-courses-section.tsx"),
      "utf8",
    );

    expect(source).toContain("{selectedCourseIds.length} / {COURSE_SELECTION_LIMIT} selected");
    expect(source).not.toContain("Math.min(COURSE_SELECTION_LIMIT, courses.length)");
  });

  it("keeps selections outside the current filtered list visible and removable during the editable period", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/convex-courses-section.tsx"),
      "utf8",
    );

    expect(source).toContain("Other selected courses");
    expect(source).toContain("getSelectedCourseIdsOutsideVisibleCourses");
    expect(source).toContain("onClick={() => onToggle(courseId)}");
    expect(source).toContain("disabled={locked}");
    expect(source).toContain("Selection locked");
  });

  it("dispatches explicit persistence status and retry events", () => {
    const statusListener = vi.fn();
    const retryListener = vi.fn();

    window.addEventListener(COURSE_SELECTION_SYNC_STATUS_EVENT, statusListener);
    window.addEventListener(COURSE_SELECTION_SYNC_RETRY_EVENT, retryListener);

    dispatchCourseSelectionSyncStatus("pending");
    retryCourseSelectionSync();

    expect(statusListener).toHaveBeenCalledTimes(1);
    expect((statusListener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ status: "pending" });
    expect(retryListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(COURSE_SELECTION_SYNC_STATUS_EVENT, statusListener);
    window.removeEventListener(COURSE_SELECTION_SYNC_RETRY_EVENT, retryListener);
  });

  it("bases cloud success and failure feedback on the existing Convex mutation promise", () => {
    const syncSource = readFileSync(
      path.resolve(process.cwd(), "src/components/education/course-selection-sync.tsx"),
      "utf8",
    );
    const coursesSource = readFileSync(
      path.resolve(process.cwd(), "src/components/education/convex-courses-section.tsx"),
      "utf8",
    );

    expect(syncSource).toContain("trackCourseSelectionSync(");
    expect(syncSource).toContain('dispatchCourseSelectionSyncStatus("pending")');
    expect(syncSource).toContain('dispatchCourseSelectionSyncStatus("success")');
    expect(syncSource).toContain('dispatchCourseSelectionSyncStatus("error")');
    expect(syncSource).toContain("COURSE_SELECTION_SYNC_RETRY_EVENT");
    expect(coursesSource).toContain("Saving course selection to your account…");
    expect(coursesSource).toContain("Course selection saved to your account.");
    expect(coursesSource).toContain("We couldn&apos;t sync your course selection.");
    expect(coursesSource).toContain("Retry sync");
  });
});
