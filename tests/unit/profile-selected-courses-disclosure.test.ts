import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const profileSource = readFileSync(
  path.join(process.cwd(), "src/components/education/local-profile-content.tsx"),
  "utf8",
);

describe("profile selected-course disclosure contract", () => {
  it("shows a two-course preview and exposes an accessible view-all disclosure only for additional courses", () => {
    expect(profileSource).toContain("const selectedCoursePreviewCount = 2");
    expect(profileSource).toContain("selectedCourses.slice(0, selectedCoursePreviewCount)");
    expect(profileSource).toContain("selectedCourses.length > selectedCoursePreviewCount");
    expect(profileSource).toContain("aria-expanded={showAllSelectedCourses}");
    expect(profileSource).toContain('aria-controls="selected-courses-grid"');
    expect(profileSource).toContain('showAllSelectedCourses ? "Show less" : `View all ${selectedCourses.length}`');
  });

  it("renders every selected course when the disclosure is expanded", () => {
    expect(profileSource).toContain("const visibleSelectedCourses = showAllSelectedCourses");
    expect(profileSource).toContain("? selectedCourses");
    expect(profileSource).toContain("visibleSelectedCourses.map((course)");
  });
});
