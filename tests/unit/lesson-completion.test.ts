import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { recordLessonCompleted, recordLessonOpened } from "@/lib/lesson-progress";
import { readLessonProgressHistory, recordLessonProgress } from "@/lib/lesson-progress-history";

beforeEach(() => {
  localStorage.clear();
});

describe("lesson completion", () => {
  it("records a completed lesson at 100 percent locally", () => {
    recordLessonCompleted("lesson-1");

    expect(readLessonProgressHistory()).toEqual([
      expect.objectContaining({
        lessonId: "lesson-1",
        status: "completed",
        progress: 100,
      }),
    ]);
  });

  it("does not downgrade a completed lesson when it is reopened", () => {
    recordLessonCompleted("lesson-1");
    recordLessonOpened("lesson-1");

    expect(readLessonProgressHistory()).toEqual([
      expect.objectContaining({
        lessonId: "lesson-1",
        status: "completed",
        progress: 100,
      }),
    ]);
  });

  it("does not downgrade existing in-progress activity when a lesson is reopened", () => {
    recordLessonProgress({
      lessonId: "lesson-1",
      status: "in_progress",
      progress: 50,
    });

    recordLessonOpened("lesson-1");

    expect(readLessonProgressHistory()).toEqual([
      expect.objectContaining({
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 50,
      }),
    ]);
  });

  it("uses the shared hardened auth runtime instead of direct Clerk hooks", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/lesson-completion-action.tsx"),
      "utf8",
    );

    expect(source).toContain("useLearnerAuthRuntime");
    expect(source).not.toContain("useAuth(");
  });

  it("passes explicit authenticated readiness into Convex learner identity resolution", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/lesson-completion-action.tsx"),
      "utf8",
    );

    expect(source).toContain("getCurrentConvexLearnerArgs(isAuthenticated)");
    expect(source).not.toContain("getCurrentConvexLearnerArgs()");
  });
});
