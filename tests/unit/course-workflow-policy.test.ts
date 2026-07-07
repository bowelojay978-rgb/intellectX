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
  canTransitionCourseStatus,
  isLearnerVisibleCourse,
} from "@/lib/course-workflow-policy";

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
});
