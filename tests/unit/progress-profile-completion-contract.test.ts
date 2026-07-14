import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const progressSource = readFileSync(
  path.join(process.cwd(), "src/components/education/local-progress-content.tsx"),
  "utf8",
);
const profileSource = readFileSync(
  path.join(process.cwd(), "src/components/education/local-profile-content.tsx"),
  "utf8",
);

describe("progress and profile completion contracts", () => {
  it("does not show a false empty progress state while selected-course catalog data is loading", () => {
    expect(progressSource).toContain("waitingForSelectedCourseCatalog");
    expect(progressSource).toContain('label="Loading selected course progress"');
    expect(progressSource).toContain('title="Selected courses are unavailable right now"');
    expect(progressSource).toContain("Your selection is preserved and no progress is invented.");
  });

  it("keeps Profile selected-course counts honest even when catalog records are temporarily unavailable", () => {
    expect(profileSource).toContain("selectedCourseIds.length - selectedCourses.length");
    expect(profileSource).toContain('label="Loading selected courses"');
    expect(profileSource).toContain('title="Selected courses are unavailable right now"');
    expect(profileSource).toContain('selectedCourseIds.length === 0 ? "None yet" : selectedCourseIds.length');
  });

  it("keeps Progress and Profile reactive to storage-backed private-state replacement", () => {
    expect(progressSource).toContain('window.addEventListener("storage", syncAll)');
    expect(profileSource).toContain('window.addEventListener("storage", syncAll)');
    expect(progressSource).toContain("LESSON_PROGRESS_HISTORY_CHANGE_EVENT");
    expect(profileSource).toContain("QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT");
  });
});
