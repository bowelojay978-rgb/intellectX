import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("staff workspace safety regressions", () => {
  it("preflights course ownership and editability before generating a media upload URL", () => {
    const source = read("convex/staffMedia.ts");
    const uploadHandler = source.slice(
      source.indexOf("export const generateStaffMediaUploadUrl"),
      source.indexOf("export const registerStaffMediaUpload"),
    );

    expect(uploadHandler).toContain("getManageableCourse");
    expect(uploadHandler).toContain("assertInstructorCourseEditable");
    expect(uploadHandler.indexOf("assertInstructorCourseEditable")).toBeLessThan(
      uploadHandler.indexOf("ctx.storage.generateUploadUrl"),
    );
  });

  it("requires the client to identify the course before requesting an upload URL", () => {
    const source = read("src/components/instructor/instructor-lesson-media-manager.tsx");
    expect(source).toContain("generateUploadUrl({ courseStableId })");
  });

  it("renders full learner-visible lesson and quiz content in the admin review surface", () => {
    const source = read("src/components/admin/admin-course-review-workspace.tsx");

    expect(source).toContain("lesson.content.filter(Boolean).map");
    expect(source).toContain("question.prompt");
    expect(source).toContain("question.choices.map");
    expect(source).toContain("question.answerIndex");
    expect(source).toContain("question.explanation");
  });

  it("protects instructor-owned nested catalog records from seed cleanup", () => {
    const source = read("convex/seed.ts");
    expect(source).toContain("shouldPreserveInstructorAuthoredCatalogDoc");
    expect(source).toContain("instructorCourseStableIds");
    expect(source).toContain("instructorQuizStableIds");
  });
});
