import { describe, expect, it } from "vitest";

import {
  getLearnerMigrationAuditTargetId,
  getQuizAttemptMigrationFingerprint,
  mergeStudyStatsForMigration,
  selectCourseSelectionForMigration,
  selectLatestUpdatedRecordForMigration,
  selectMonotonicLessonProgressForMigration,
} from "../../convex/lib/migrateLearnerData";

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

describe("learner migration domain merge policies", () => {
  const destinationUserKey = "auth:https://clerk.example|user_123";
  const sourceUserKey = "learner:local@example.com";

  it("prefers authenticated destination data when updatedAt timestamps tie", () => {
    const result = selectLatestUpdatedRecordForMigration(
      [
        { userKey: sourceUserKey, updatedAt: 100, value: "local" },
        { userKey: destinationUserKey, updatedAt: 100, value: "authenticated" },
      ],
      destinationUserKey,
    );

    expect(result).toMatchObject({
      userKey: destinationUserKey,
      value: "authenticated",
    });
  });

  it("never lets a newer unlocked local course selection unlock a locked authenticated selection", () => {
    const result = selectCourseSelectionForMigration(
      [
        {
          userKey: destinationUserKey,
          selectedCourseIds: ["biology"],
          selectedAt: 10,
          gracePeriodEndsAt: 20,
          lockedAt: 30,
          locked: true,
          updatedAt: 100,
        },
        {
          userKey: sourceUserKey,
          selectedCourseIds: ["chemistry"],
          selectedAt: 10,
          gracePeriodEndsAt: 999,
          lockedAt: null,
          locked: false,
          updatedAt: 200,
        },
      ],
      destinationUserKey,
    );

    expect(result).toMatchObject({
      userKey: destinationUserKey,
      selectedCourseIds: ["biology"],
      locked: true,
      lockedAt: 30,
    });
  });

  it("distinguishes quiz attempts that share score metadata but contain different answers", () => {
    const baseAttempt = {
      quizId: "quiz-1",
      completedAt: 100,
      score: 1,
      totalQuestions: 2,
    };

    expect(
      getQuizAttemptMigrationFingerprint({ ...baseAttempt, answers: [0, 1] }),
    ).not.toBe(
      getQuizAttemptMigrationFingerprint({ ...baseAttempt, answers: [1, 0] }),
    );
  });

  it("preserves the longest streak while using the newer study activity snapshot", () => {
    const result = mergeStudyStatsForMigration(
      [
        {
          userKey: sourceUserKey,
          currentStreak: 3,
          longestStreak: 4,
          weeklyActiveDays: ["2026-07-14"],
          lastStudiedDate: "2026-07-14",
          updatedAt: 200,
        },
      ],
      [
        {
          userKey: destinationUserKey,
          currentStreak: 2,
          longestStreak: 12,
          weeklyActiveDays: ["2026-07-13"],
          lastStudiedDate: "2026-07-13",
          updatedAt: 100,
        },
      ],
      destinationUserKey,
    );

    expect(result).toMatchObject({
      userKey: destinationUserKey,
      currentStreak: 3,
      longestStreak: 12,
      weeklyActiveDays: ["2026-07-14"],
      lastStudiedDate: "2026-07-14",
      updatedAt: 200,
    });
  });

  it("uses a stable source-to-destination target id for persistent migration replay checks", () => {
    expect(
      getLearnerMigrationAuditTargetId({ sourceUserKey, destinationUserKey }),
    ).toBe(`${sourceUserKey}=>${destinationUserKey}`);
  });
});
