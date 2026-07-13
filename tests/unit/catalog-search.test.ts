import { describe, expect, it } from "vitest";

import { searchLearnerCatalog } from "@/lib/catalog-search";
import { buildLearnerCatalog } from "@/lib/learner-catalog-client";
import { isLearnerAppPath } from "@/lib/learner-routes";

describe("learner catalog search", () => {
  const catalog = buildLearnerCatalog();

  it("searches courses, lessons, and quizzes across useful metadata", () => {
    expect(searchLearnerCatalog(catalog, "critical thinking").courses.map((course) => course.id)).toContain("critical-thinking");
    expect(searchLearnerCatalog(catalog, "memory retrieval").lessons.map((lesson) => lesson.id)).toContain("memory-systems");
    expect(searchLearnerCatalog(catalog, "exam accelerator").quizzes.map((quiz) => quiz.id)).toContain("exam-accelerator-check");
  });

  it("handles empty and unmatched searches without exposing unrelated results", () => {
    expect(searchLearnerCatalog(catalog, "")).toEqual({ courses: [], lessons: [], quizzes: [] });
    expect(searchLearnerCatalog(catalog, "not-a-real-topic")).toEqual({ courses: [], lessons: [], quizzes: [] });
  });

  it("keeps search behind the learner app route guard", () => {
    expect(isLearnerAppPath("/search")).toBe(true);
  });
});
