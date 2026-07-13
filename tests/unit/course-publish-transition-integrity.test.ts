import { describe, expect, it } from "vitest";

import {
  APPROVED,
  PUBLISHED,
  UNPUBLISHED,
  assertCanPublishCourse,
} from "../../convex/lib/courseWorkflowMutations";

describe("course publish transition integrity", () => {
  it("allows approved unpublished courses to publish", () => {
    expect(() =>
      assertCanPublishCourse({ reviewStatus: APPROVED, publicationStatus: UNPUBLISHED }),
    ).not.toThrow();
  });

  it("rejects duplicate direct publish transitions", () => {
    expect(() =>
      assertCanPublishCourse({ reviewStatus: APPROVED, publicationStatus: PUBLISHED }),
    ).toThrow("Course is already published.");
  });
});
