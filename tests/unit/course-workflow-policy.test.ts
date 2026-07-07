import { describe, expect, it } from "vitest";

import {
  ADMIN,
  APPROVED,
  ARCHIVED,
  CHANGES_REQUESTED,
  DRAFT,
  INSTRUCTOR,
  LEARNER,
  PUBLISHED,
  SUBMITTED_FOR_REVIEW,
  UNPUBLISHED,
  canAccessStaffArea,
  canManageCourseWorkflow,
  canReviewCourses,
  canSubmitCourseForReview,
  canTransitionCourseStatus,
  filterLearnerVisibleCourses,
  findLearnerVisibleCourse,
  isLearnerVisibleCourse,
} from "@/lib/course-workflow-policy";
import { courses } from "@/data/courses";

describe("course workflow policy", () => {
  it("only exposes courses that are approved and published to learners", () => {
    expect(
      isLearnerVisibleCourse({
        reviewStatus: APPROVED,
        publicationStatus: PUBLISHED,
      }),
    ).toBe(true);

    expect(
      isLearnerVisibleCourse({
        reviewStatus: DRAFT,
        publicationStatus: PUBLISHED,
      }),
    ).toBe(false);

    expect(
      isLearnerVisibleCourse({
        reviewStatus: APPROVED,
        publicationStatus: UNPUBLISHED,
      }),
    ).toBe(false);

    expect(
      isLearnerVisibleCourse({
        reviewStatus: SUBMITTED_FOR_REVIEW,
        publicationStatus: PUBLISHED,
      }),
    ).toBe(false);

    expect(
      isLearnerVisibleCourse({
        reviewStatus: CHANGES_REQUESTED,
        publicationStatus: UNPUBLISHED,
      }),
    ).toBe(false);

    expect(
      isLearnerVisibleCourse({
        reviewStatus: APPROVED,
        publicationStatus: ARCHIVED,
      }),
    ).toBe(false);
  });

  it("filters learner-facing static course records by approved and published status", () => {
    const visibleCourses = filterLearnerVisibleCourses([
      {
        id: "visible",
        slug: "visible",
        reviewStatus: APPROVED,
        publicationStatus: PUBLISHED,
      },
      {
        id: "approved-unpublished",
        slug: "approved-unpublished",
        reviewStatus: APPROVED,
        publicationStatus: UNPUBLISHED,
      },
      {
        id: "draft-published",
        slug: "draft-published",
        reviewStatus: DRAFT,
        publicationStatus: PUBLISHED,
      },
      {
        id: "submitted-published",
        slug: "submitted-published",
        reviewStatus: SUBMITTED_FOR_REVIEW,
        publicationStatus: PUBLISHED,
      },
      {
        id: "changes-requested",
        slug: "changes-requested",
        reviewStatus: CHANGES_REQUESTED,
        publicationStatus: PUBLISHED,
      },
      {
        id: "archived",
        slug: "archived",
        reviewStatus: APPROVED,
        publicationStatus: ARCHIVED,
      },
    ]);

    expect(visibleCourses.map((course) => course.id)).toEqual(["visible"]);
    expect(findLearnerVisibleCourse(visibleCourses, "visible")?.id).toBe("visible");
    expect(findLearnerVisibleCourse(visibleCourses, "approved-unpublished")).toBeUndefined();
  });

  it("keeps trusted legacy records visible only when compatibility is explicit", () => {
    const options = { trustedLegacyCourseIds: ["ai-study-systems"] };

    expect(isLearnerVisibleCourse({ id: "ai-study-systems" })).toBe(false);
    expect(isLearnerVisibleCourse({ id: "ai-study-systems" }, options)).toBe(true);
    expect(isLearnerVisibleCourse({ id: "unknown-course" }, options)).toBe(false);
    expect(isLearnerVisibleCourse({}, options)).toBe(false);
    expect(isLearnerVisibleCourse({ id: "ai-study-systems", reviewStatus: APPROVED }, options)).toBe(false);
    expect(isLearnerVisibleCourse({ id: "ai-study-systems", publicationStatus: PUBLISHED }, options)).toBe(false);
  });

  it("keeps current demo courses learner-visible", () => {
    expect(courses.map((course) => course.id)).toEqual([
      "ai-study-systems",
      "critical-thinking",
      "exam-accelerator",
    ]);
  });

  it("allows instructors to submit new and resubmitted courses for review", () => {
    expect(canTransitionCourseStatus(DRAFT, SUBMITTED_FOR_REVIEW, INSTRUCTOR)).toBe(true);
    expect(canTransitionCourseStatus(CHANGES_REQUESTED, SUBMITTED_FOR_REVIEW, INSTRUCTOR)).toBe(true);
    expect(canTransitionCourseStatus(APPROVED, PUBLISHED, INSTRUCTOR)).toBe(false);
  });

  it("allows admins to manage review, publication, and archival transitions", () => {
    expect(canTransitionCourseStatus(SUBMITTED_FOR_REVIEW, APPROVED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(SUBMITTED_FOR_REVIEW, CHANGES_REQUESTED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(APPROVED, PUBLISHED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(PUBLISHED, UNPUBLISHED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(UNPUBLISHED, PUBLISHED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(DRAFT, ARCHIVED, ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(PUBLISHED, ARCHIVED, ADMIN)).toBe(true);
  });

  it("blocks learners from transitioning statuses", () => {
    expect(canTransitionCourseStatus(DRAFT, SUBMITTED_FOR_REVIEW, LEARNER)).toBe(false);
    expect(canTransitionCourseStatus(PUBLISHED, UNPUBLISHED, LEARNER)).toBe(false);
  });

  it("fails closed for invalid or unsupported transitions", () => {
    expect(canTransitionCourseStatus(DRAFT, APPROVED, INSTRUCTOR)).toBe(false);
    expect(canTransitionCourseStatus(APPROVED, SUBMITTED_FOR_REVIEW, ADMIN)).toBe(false);
    expect(canTransitionCourseStatus(ARCHIVED, DRAFT, ADMIN)).toBe(false);
    expect(canTransitionCourseStatus(DRAFT, DRAFT, ADMIN)).toBe(false);
  });

  it("defines staff access intent without granting learner capabilities", () => {
    expect(canAccessStaffArea(LEARNER, "instructor")).toBe(false);
    expect(canAccessStaffArea(LEARNER, "admin")).toBe(false);
    expect(canManageCourseWorkflow(LEARNER)).toBe(false);
    expect(canReviewCourses(LEARNER)).toBe(false);
    expect(canSubmitCourseForReview(LEARNER)).toBe(false);
  });

  it("allows instructors only instructor draft and submission intent", () => {
    expect(canAccessStaffArea(INSTRUCTOR, "instructor")).toBe(true);
    expect(canSubmitCourseForReview(INSTRUCTOR)).toBe(true);
    expect(canAccessStaffArea(INSTRUCTOR, "admin")).toBe(false);
    expect(canManageCourseWorkflow(INSTRUCTOR)).toBe(false);
    expect(canReviewCourses(INSTRUCTOR)).toBe(false);
    expect(canTransitionCourseStatus(APPROVED, PUBLISHED, INSTRUCTOR)).toBe(false);
  });

  it("allows admins to review, publish, and manage course workflow", () => {
    expect(canAccessStaffArea(ADMIN, "instructor")).toBe(true);
    expect(canAccessStaffArea(ADMIN, "admin")).toBe(true);
    expect(canSubmitCourseForReview(ADMIN)).toBe(true);
    expect(canManageCourseWorkflow(ADMIN)).toBe(true);
    expect(canReviewCourses(ADMIN)).toBe(true);
    expect(canTransitionCourseStatus(APPROVED, PUBLISHED, ADMIN)).toBe(true);
  });

  it("fails closed for unknown runtime roles", () => {
    expect(canAccessStaffArea("owner", "admin")).toBe(false);
    expect(canAccessStaffArea(null, "instructor")).toBe(false);
    expect(canManageCourseWorkflow(undefined)).toBe(false);
    expect(canReviewCourses("")).toBe(false);
    expect(canSubmitCourseForReview("teacher")).toBe(false);
  });
});
