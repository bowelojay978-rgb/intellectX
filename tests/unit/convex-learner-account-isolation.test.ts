import { describe, expect, it } from "vitest";

import { getAcademicProfile, upsertAcademicProfile } from "../../convex/academicProfiles";
import { getCourseSelection, upsertCourseSelection } from "../../convex/courseSelections";
import { getPaidAccessDecision } from "../../convex/entitlements";
import { migrateLocalLearnerDataToAuthenticatedAccount } from "../../convex/learnerMigration";
import { updateLessonProgress } from "../../convex/lessons";
import { getLessonNote, upsertLessonNote } from "../../convex/notes";
import { getProgressSummary } from "../../convex/progress";
import { getQuizAttempts, submitQuizAttempt } from "../../convex/quizzes";
import { updateStudyStats } from "../../convex/studyStats";
import { clerkIdentity, convexHandler, convexTestContext, InMemoryConvexDb } from "./helpers/in-memory-convex";

const USER_A = "auth:https://clerk.example|user_a";
const USER_B = "auth:https://clerk.example|user_b";

function learnerDb() {
  return new InMemoryConvexDb({
    courses: [
      {
        _id: "course-record",
        stableId: "course-1",
        slug: "course-1",
        title: "Course One",
        reviewStatus: "approved",
        publicationStatus: "published",
        accessLevel: "free",
      },
    ],
    lessons: [
      {
        _id: "lesson-record",
        stableId: "lesson-1",
        courseStableId: "course-1",
        title: "Lesson One",
        accessLevel: "free",
      },
    ],
    quizzes: [
      {
        _id: "quiz-record",
        stableId: "quiz-1",
        courseStableId: "course-1",
        title: "Quiz One",
        accessLevel: "free",
      },
    ],
    questions: [
      {
        _id: "question-record",
        stableId: "question-1",
        quizStableId: "quiz-1",
        prompt: "Pick A",
        choices: ["A", "B"],
        answerIndex: 0,
        explanation: "A is correct.",
        order: 0,
      },
    ],
    academicProfiles: [
      {
        _id: "profile-a",
        userKey: USER_A,
        educationLevel: "A-level",
        curriculumOrInstitution: "A-school",
        gradeOrYear: "A-year",
        subjectsOrModules: ["A-subject"],
        updatedAt: 100,
      },
      {
        _id: "profile-b",
        userKey: USER_B,
        educationLevel: "B-level",
        curriculumOrInstitution: "B-school",
        gradeOrYear: "B-year",
        subjectsOrModules: ["B-subject"],
        updatedAt: 200,
      },
    ],
    courseSelections: [
      {
        _id: "selection-a",
        userKey: USER_A,
        selectedCourseIds: ["course-1"],
        selectedAt: Date.now(),
        gracePeriodEndsAt: Date.now() + 60_000,
        lockedAt: null,
        locked: false,
        updatedAt: 100,
      },
      {
        _id: "selection-b",
        userKey: USER_B,
        selectedCourseIds: ["private-b-course"],
        selectedAt: 1,
        gracePeriodEndsAt: 2,
        lockedAt: 2,
        locked: true,
        updatedAt: 200,
      },
    ],
    notes: [
      { _id: "note-a", userKey: USER_A, lessonId: "lesson-1", body: "A note", updatedAt: 100 },
      { _id: "note-b", userKey: USER_B, lessonId: "lesson-1", body: "B secret", updatedAt: 200 },
    ],
    lessonProgress: [
      {
        _id: "progress-a",
        userKey: USER_A,
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 10,
        updatedAt: 100,
      },
      {
        _id: "progress-b",
        userKey: USER_B,
        lessonId: "lesson-1",
        status: "completed",
        progress: 100,
        updatedAt: 200,
      },
    ],
    quizAttempts: [
      {
        _id: "attempt-a",
        userKey: USER_A,
        quizId: "quiz-1",
        submissionId: "submission-a",
        score: 0,
        totalQuestions: 1,
        answers: [1],
        percentage: 0,
        completedAt: 100,
      },
      {
        _id: "attempt-b",
        userKey: USER_B,
        quizId: "quiz-1",
        submissionId: "submission-b",
        score: 1,
        totalQuestions: 1,
        answers: [0],
        percentage: 100,
        completedAt: 200,
      },
    ],
    studyStats: [
      {
        _id: "stats-a",
        userKey: USER_A,
        currentStreak: 1,
        longestStreak: 2,
        weeklyActiveDays: ["2026-07-14"],
        lastStudiedDate: "2026-07-14",
        updatedAt: 100,
      },
      {
        _id: "stats-b",
        userKey: USER_B,
        currentStreak: 99,
        longestStreak: 99,
        weeklyActiveDays: ["2026-07-15"],
        lastStudiedDate: "2026-07-15",
        updatedAt: 200,
      },
    ],
    entitlements: [
      {
        _id: "entitlement-a",
        userKey: USER_A,
        productKey: "premium",
        status: "active",
        currentPeriodEndsAt: Date.now() + 60_000,
        updatedAt: 100,
      },
      {
        _id: "entitlement-b",
        userKey: USER_B,
        productKey: "premium",
        status: "cancelled",
        updatedAt: 200,
      },
    ],
  });
}

describe("Convex learner account isolation", () => {
  it("uses verified identity for every learner read and ignores a spoofed userKey", async () => {
    const db = learnerDb();
    const ctx = convexTestContext(db, clerkIdentity("user_a"));
    const spoofedOwner = { userKey: USER_B };

    const profile = await convexHandler(getAcademicProfile)(ctx, spoofedOwner);
    const selection = await convexHandler(getCourseSelection)(ctx, spoofedOwner);
    const note = await convexHandler(getLessonNote)(ctx, { ...spoofedOwner, lessonStableId: "lesson-1" });
    const progress = await convexHandler(getProgressSummary)(ctx, spoofedOwner);
    const attempts = await convexHandler(getQuizAttempts)(ctx, spoofedOwner);
    const entitlement = await convexHandler(getPaidAccessDecision)(ctx, { ...spoofedOwner, productKey: "premium" });

    expect(profile).toMatchObject({ userKey: USER_A, curriculumOrInstitution: "A-school" });
    expect(selection).toMatchObject({ userKey: USER_A, selectedCourseIds: ["course-1"] });
    expect(note).toMatchObject({ userKey: USER_A, body: "A note" });
    expect(progress.lessonProgress).toHaveLength(1);
    expect(progress.lessonProgress[0]).toMatchObject({ userKey: USER_A, progress: 10 });
    expect(progress.quizAttempts).toEqual([expect.objectContaining({ userKey: USER_A, submissionId: "submission-a" })]);
    expect(progress.studyStats).toMatchObject({ userKey: USER_A, currentStreak: 1 });
    expect(attempts).toEqual([expect.objectContaining({ userKey: USER_A, submissionId: "submission-a" })]);
    expect(entitlement).toEqual({ allowed: true, reason: "active_entitlement" });
  });

  it("writes only to the authenticated learner when another userKey is supplied", async () => {
    const db = learnerDb();
    const ctx = convexTestContext(db, clerkIdentity("user_a"));
    const beforeB = JSON.stringify({
      profile: db.rows("academicProfiles").find((record) => record.userKey === USER_B),
      selection: db.rows("courseSelections").find((record) => record.userKey === USER_B),
      note: db.rows("notes").find((record) => record.userKey === USER_B),
      progress: db.rows("lessonProgress").find((record) => record.userKey === USER_B),
      attempts: db.rows("quizAttempts").filter((record) => record.userKey === USER_B),
      stats: db.rows("studyStats").find((record) => record.userKey === USER_B),
    });

    await convexHandler(upsertAcademicProfile)(ctx, {
      userKey: USER_B,
      educationLevel: "A-updated",
      curriculumOrInstitution: "A-updated-school",
      gradeOrYear: "A-updated-year",
      subjectsOrModules: ["A-updated-subject"],
    });
    await convexHandler(upsertCourseSelection)(ctx, {
      userKey: USER_B,
      selectedCourseIds: ["course-1"],
      selectedAt: 0,
      gracePeriodEndsAt: 0,
      lockedAt: 0,
      locked: true,
    });
    await convexHandler(upsertLessonNote)(ctx, { userKey: USER_B, lessonStableId: "lesson-1", body: "A updated note" });
    await convexHandler(updateLessonProgress)(ctx, {
      userKey: USER_B,
      lessonId: "lesson-1",
      status: "in_progress",
      progress: 40,
    });
    await convexHandler(submitQuizAttempt)(ctx, {
      userKey: USER_B,
      quizId: "quiz-1",
      submissionId: "submission-a-2",
      answers: [0],
    });
    await convexHandler(updateStudyStats)(ctx, {
      userKey: USER_B,
      currentStreak: 3,
      longestStreak: 3,
      weeklyActiveDays: ["2026-07-14", "2026-07-15"],
      lastStudiedDate: "2026-07-15",
    });

    expect(db.rows("academicProfiles").find((record) => record.userKey === USER_A)).toMatchObject({
      educationLevel: "A-updated",
    });
    expect(db.rows("notes").find((record) => record.userKey === USER_A)).toMatchObject({ body: "A updated note" });
    expect(db.rows("lessonProgress").find((record) => record.userKey === USER_A)).toMatchObject({ progress: 40 });
    expect(db.rows("quizAttempts")).toContainEqual(
      expect.objectContaining({ userKey: USER_A, submissionId: "submission-a-2" }),
    );
    expect(db.rows("studyStats").find((record) => record.userKey === USER_A)).toMatchObject({ currentStreak: 3 });
    expect(
      JSON.stringify({
        profile: db.rows("academicProfiles").find((record) => record.userKey === USER_B),
        selection: db.rows("courseSelections").find((record) => record.userKey === USER_B),
        note: db.rows("notes").find((record) => record.userKey === USER_B),
        progress: db.rows("lessonProgress").find((record) => record.userKey === USER_B),
        attempts: db.rows("quizAttempts").filter((record) => record.userKey === USER_B),
        stats: db.rows("studyStats").find((record) => record.userKey === USER_B),
      }),
    ).toBe(beforeB);
  });

  it.each(["missing", "invalid", "expired"])("fails closed when authentication is %s", async () => {
    const db = learnerDb();
    const ctx = convexTestContext(db, null);

    await expect(convexHandler(getAcademicProfile)(ctx, {})).rejects.toThrow("learner identity is required");
    await expect(convexHandler(upsertLessonNote)(ctx, { lessonStableId: "lesson-1", body: "blocked" })).rejects.toThrow(
      "learner identity is required",
    );
    await expect(convexHandler(getPaidAccessDecision)(ctx, { productKey: "premium" })).rejects.toThrow(
      "learner identity is required",
    );
    await expect(
      convexHandler(migrateLocalLearnerDataToAuthenticatedAccount)(ctx, {
        sourceUserKey: "learner:user_a@example.com",
      }),
    ).rejects.toThrow("Authenticated Convex identity is required");
  });

  it("allows migration only from the authenticated account's local identity and derives its destination", async () => {
    const db = new InMemoryConvexDb({
      academicProfiles: [
        {
          _id: "local-a-profile",
          userKey: "learner:user_a@example.com",
          educationLevel: "local-a",
          curriculumOrInstitution: "local-a-school",
          gradeOrYear: "local-a-year",
          subjectsOrModules: ["local-a-subject"],
          updatedAt: 100,
        },
      ],
    });
    const ctx = convexTestContext(db, clerkIdentity("user_a"));

    await expect(
      convexHandler(migrateLocalLearnerDataToAuthenticatedAccount)(ctx, {
        sourceUserKey: "learner:user_b@example.com",
      }),
    ).rejects.toThrow("Migration source must belong to the authenticated account email");

    const result = await convexHandler(migrateLocalLearnerDataToAuthenticatedAccount)(ctx, {
      sourceUserKey: "learner:user_a@example.com",
    });

    expect(result.destinationUserKey).toBe(USER_A);
    expect(db.rows("academicProfiles")).toContainEqual(
      expect.objectContaining({ userKey: USER_A, educationLevel: "local-a" }),
    );
    expect(db.rows("academicProfiles").some((record) => record.userKey === USER_B)).toBe(false);
  });
});
