import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("staff workspace production wiring", () => {
  it("replaces admin placeholder pages with real workspaces", () => {
    const adminPage = read("src/app/admin/page.tsx");
    const reviewPage = read("src/app/admin/course-review/page.tsx");
    const instructorsPage = read("src/app/admin/instructors/page.tsx");

    expect(adminPage).toContain("AdminDashboard");
    expect(reviewPage).toContain("AdminCourseReviewWorkspace");
    expect(instructorsPage).toContain("AdminInstructorsWorkspace");
    expect(instructorsPage).toContain("listAdminManagedUsers");

    for (const source of [adminPage, reviewPage, instructorsPage]) {
      expect(source).not.toContain("getStaffPlaceholderMetadata");
    }
  });

  it("uses real server mutations rather than frontend-only admin preview decisions", () => {
    const source = read("src/components/admin/admin-course-review-workspace.tsx");

    expect(source).toContain("convexApi.courses.approveCourse");
    expect(source).toContain("convexApi.courses.requestCourseChanges");
    expect(source).toContain("convexApi.courses.publishCourse");
    expect(source).toContain("convexApi.courses.unpublishCourse");
    expect(source).toContain("convexApi.courses.archiveCourse");
    expect(source.toLowerCase()).not.toContain("frontend preview");
    expect(source).not.toContain("No backend publication");
  });

  it("keeps instructor authoring and file uploads on authenticated Convex boundaries", () => {
    const builderPage = read("src/app/instructor/courses/new/page.tsx");
    const mediaApi = read("convex/staffMedia.ts");
    const mediaManager = read("src/components/instructor/instructor-lesson-media-manager.tsx");

    expect(builderPage).toContain("InstructorCourseBuilder");
    expect(builderPage).toContain("InstructorLessonMediaManager");
    expect(mediaApi).toContain("requireInstructorOrAdmin");
    expect(mediaApi).toContain("ctx.storage.generateUploadUrl");
    expect(mediaApi).toContain('ctx.db.system.get("_storage"');
    expect(mediaApi).toContain("canManageInstructorCourse");
    expect(mediaManager).toContain("generateStaffMediaUploadUrl");
    expect(mediaManager).toContain("registerStaffMediaUpload");
    expect(mediaManager).toContain("attachLessonMedia");
  });

  it("requires trusted admin authorization for review data and instructor access changes", () => {
    const adminQueries = read("convex/adminCourses.ts");
    const serverAction = read("src/app/admin/instructors/actions.ts");

    expect(adminQueries).toContain("requireAdmin(identity)");
    expect(serverAction).toContain("getAdminClerkSession");
    expect(serverAction).toContain("updateUserMetadata");
    expect(serverAction).toContain('nextRole !== "instructor" && nextRole !== "learner"');
  });
});
