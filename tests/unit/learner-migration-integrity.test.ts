import { describe, expect, it } from "vitest";

import { selectMonotonicLessonProgressForMigration } from "../../convex/lib/migrateLearnerData";

describe("learner migration lesson-progress integrity", () => {
  it("never lets newer lower progress overwrite an older completed lesson", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "auth:user-1",
        lessonId: "lesson-1",
        status: "completed",
        progress: 100,
        updatedAt: 100,
      },
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 25,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      userKey: "auth:user-1",
      progress: 100,
      status: "completed",
      updatedAt: 100,
    });
  });

  it("uses the newer record only when progress is equal", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "auth:user-1",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 50,
        updatedAt: 100,
      },
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 50,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      userKey: "learner:user@example.com",
      progress: 50,
      updatedAt: 200,
    });
  });

  it("clamps legacy progress and normalizes 100 percent to completed", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 150,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      progress: 100,
      status: "completed",
    });
  });

  it("returns null for empty input", () => {
    expect(selectMonotonicLessonProgressForMigration([])).toBeNull();
  });
});
