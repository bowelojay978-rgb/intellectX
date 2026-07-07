import { describe, expect, it } from "vitest";

import {
  filterLearnerVisibleCourseRecords,
  isLearnerVisibleCourseRecord,
} from "../../convex/lib/courseWorkflow";

describe("Convex course workflow visibility", () => {
  it("exposes only approved and published course records to learners", () => {
    const courses = filterLearnerVisibleCourseRecords([
      {
        stableId: "visible",
        reviewStatus: "approved",
        publicationStatus: "published",
      },
      {
        stableId: "approved-unpublished",
        reviewStatus: "approved",
        publicationStatus: "unpublished",
      },
      {
        stableId: "draft-published",
        reviewStatus: "draft",
        publicationStatus: "published",
      },
      {
        stableId: "submitted-published",
        reviewStatus: "submitted_for_review",
        publicationStatus: "published",
      },
      {
        stableId: "changes-requested",
        reviewStatus: "changes_requested",
        publicationStatus: "published",
      },
      {
        stableId: "archived",
        reviewStatus: "approved",
        publicationStatus: "archived",
      },
    ]);

    expect(courses.map((course) => course.stableId)).toEqual(["visible"]);
  });

  it("requires explicit compatibility mode before missing workflow fields are visible", () => {
    const options = { trustedLegacyCourseIds: ["ai-study-systems"] };

    expect(isLearnerVisibleCourseRecord({ stableId: "ai-study-systems" })).toBe(false);
    expect(isLearnerVisibleCourseRecord({ stableId: "ai-study-systems" }, options)).toBe(true);
    expect(isLearnerVisibleCourseRecord({ stableId: "unknown-course" }, options)).toBe(false);
    expect(isLearnerVisibleCourseRecord({}, options)).toBe(false);
    expect(
      isLearnerVisibleCourseRecord({ stableId: "ai-study-systems", reviewStatus: "approved" }, options),
    ).toBe(false);
    expect(
      isLearnerVisibleCourseRecord({ stableId: "ai-study-systems", publicationStatus: "published" }, options),
    ).toBe(false);
  });
});
