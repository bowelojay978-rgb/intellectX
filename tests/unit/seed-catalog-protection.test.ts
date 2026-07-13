import { describe, expect, it } from "vitest";

import { shouldPreserveInstructorAuthoredCatalogDoc } from "../../convex/lib/seedCatalogProtection";

const instructorCourses = new Set(["instructor-course"]);
const instructorQuizzes = new Set(["instructor-quiz"]);

describe("seed catalog cleanup protection", () => {
  it("preserves instructor-owned course records", () => {
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "courses",
        { instructorId: "user_instructor" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(true);
  });

  it("preserves lessons and quizzes that belong to instructor courses", () => {
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "lessons",
        { courseStableId: "instructor-course" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(true);
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "quizzes",
        { courseStableId: "instructor-course" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(true);
  });

  it("preserves questions that belong to instructor quizzes", () => {
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "questions",
        { quizStableId: "instructor-quiz" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(true);
  });

  it("does not preserve unrelated obsolete bundled-catalog records", () => {
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "courses",
        {},
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(false);
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "lessons",
        { courseStableId: "obsolete-seed-course" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(false);
    expect(
      shouldPreserveInstructorAuthoredCatalogDoc(
        "questions",
        { quizStableId: "obsolete-seed-quiz" },
        instructorCourses,
        instructorQuizzes,
      ),
    ).toBe(false);
  });
});
