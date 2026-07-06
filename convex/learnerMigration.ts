import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { prepareLearnerDataMigration } from "./lib/migrateLearnerData";

type MigrationSummary = {
  sourceUserKey: string;
  destinationUserKey: string;
  academicProfiles: number;
  courseSelections: number;
  quizAttempts: number;
  lessonProgress: number;
  notes: number;
  studyStats: number;
};

function latestByUpdatedAt<T extends { updatedAt: number }>(records: T[]) {
  return records.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
}

function quizAttemptExistsUnderDestination(
  sourceAttempt: Doc<"quizAttempts">,
  destinationAttempts: Doc<"quizAttempts">[],
) {
  return destinationAttempts.some(
    (attempt) =>
      attempt.quizId === sourceAttempt.quizId &&
      attempt.completedAt === sourceAttempt.completedAt &&
      attempt.score === sourceAttempt.score &&
      attempt.totalQuestions === sourceAttempt.totalQuestions,
  );
}

export const migrateLocalLearnerDataToAuthenticatedAccount = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args): Promise<MigrationSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    const { sourceUserKey, destinationUserKey } = prepareLearnerDataMigration(identity, args.sourceUserKey);
    const summary: MigrationSummary = {
      sourceUserKey,
      destinationUserKey,
      academicProfiles: 0,
      courseSelections: 0,
      quizAttempts: 0,
      lessonProgress: 0,
      notes: 0,
      studyStats: 0,
    };

    // Local/free migration bridge only. This copies or merges browser-derived
    // learner data into the authenticated account key; it is not an entitlement
    // or paid-access mechanism.
    const sourceAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const latestAcademicProfile = latestByUpdatedAt([...sourceAcademicProfiles, ...destinationAcademicProfiles]);
    const destinationAcademicProfile = latestByUpdatedAt(destinationAcademicProfiles);

    if (latestAcademicProfile && latestAcademicProfile.userKey !== destinationUserKey) {
      const nextProfile = {
        userKey: destinationUserKey,
        educationLevel: latestAcademicProfile.educationLevel,
        curriculumOrInstitution: latestAcademicProfile.curriculumOrInstitution,
        gradeOrYear: latestAcademicProfile.gradeOrYear,
        subjectsOrModules: latestAcademicProfile.subjectsOrModules,
        updatedAt: latestAcademicProfile.updatedAt,
      };

      if (destinationAcademicProfile) {
        await ctx.db.patch(destinationAcademicProfile._id, nextProfile);
      } else {
        await ctx.db.insert("academicProfiles", nextProfile);
      }
      summary.academicProfiles = 1;
    }

    const sourceCourseSelections = await ctx.db
      .query("courseSelections")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationCourseSelections = await ctx.db
      .query("courseSelections")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const latestCourseSelection = latestByUpdatedAt([...sourceCourseSelections, ...destinationCourseSelections]);
    const destinationCourseSelection = latestByUpdatedAt(destinationCourseSelections);

    if (latestCourseSelection && latestCourseSelection.userKey !== destinationUserKey) {
      const nextSelection = {
        userKey: destinationUserKey,
        selectedCourseIds: latestCourseSelection.selectedCourseIds,
        selectedAt: latestCourseSelection.selectedAt,
        gracePeriodEndsAt: latestCourseSelection.gracePeriodEndsAt,
        lockedAt: latestCourseSelection.lockedAt,
        locked: latestCourseSelection.locked,
        updatedAt: latestCourseSelection.updatedAt,
      };

      if (destinationCourseSelection) {
        await ctx.db.patch(destinationCourseSelection._id, nextSelection);
      } else {
        await ctx.db.insert("courseSelections", nextSelection);
      }
      summary.courseSelections = 1;
    }

    const sourceQuizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationQuizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();

    for (const sourceAttempt of sourceQuizAttempts) {
      if (quizAttemptExistsUnderDestination(sourceAttempt, destinationQuizAttempts)) {
        continue;
      }

      await ctx.db.insert("quizAttempts", {
        userKey: destinationUserKey,
        quizId: sourceAttempt.quizId,
        score: sourceAttempt.score,
        totalQuestions: sourceAttempt.totalQuestions,
        answers: sourceAttempt.answers,
        quizTitle: sourceAttempt.quizTitle,
        percentage: sourceAttempt.percentage,
        completedAt: sourceAttempt.completedAt,
      });
      summary.quizAttempts += 1;
    }

    const sourceLessonProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationLessonProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const lessonIds = new Set([...sourceLessonProgress, ...destinationLessonProgress].map((progress) => progress.lessonId));

    for (const lessonId of lessonIds) {
      const latestProgress = latestByUpdatedAt(
        [...sourceLessonProgress, ...destinationLessonProgress].filter((progress) => progress.lessonId === lessonId),
      );
      const destinationProgress = destinationLessonProgress.find((progress) => progress.lessonId === lessonId);

      if (!latestProgress || latestProgress.userKey === destinationUserKey) {
        continue;
      }

      const nextProgress = {
        userKey: destinationUserKey,
        lessonId: latestProgress.lessonId,
        status: latestProgress.status,
        progress: latestProgress.progress,
        updatedAt: latestProgress.updatedAt,
      };

      if (destinationProgress) {
        await ctx.db.patch(destinationProgress._id, nextProgress);
      } else {
        await ctx.db.insert("lessonProgress", nextProgress);
      }
      summary.lessonProgress += 1;
    }

    const sourceNotes = await ctx.db
      .query("notes")
      .withIndex("by_user_lesson", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationNotes = await ctx.db
      .query("notes")
      .withIndex("by_user_lesson", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const noteLessonIds = new Set([...sourceNotes, ...destinationNotes].map((note) => note.lessonId));

    for (const lessonId of noteLessonIds) {
      const latestNote = latestByUpdatedAt([...sourceNotes, ...destinationNotes].filter((note) => note.lessonId === lessonId));
      const destinationNote = destinationNotes.find((note) => note.lessonId === lessonId);

      if (!latestNote || latestNote.userKey === destinationUserKey) {
        continue;
      }

      const nextNote = {
        userKey: destinationUserKey,
        lessonId: latestNote.lessonId,
        body: latestNote.body,
        updatedAt: latestNote.updatedAt,
      };

      if (destinationNote) {
        await ctx.db.patch(destinationNote._id, nextNote);
      } else {
        await ctx.db.insert("notes", nextNote);
      }
      summary.notes += 1;
    }

    const sourceStudyStats = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationStudyStats = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const latestStudyStats = latestByUpdatedAt([...sourceStudyStats, ...destinationStudyStats]);
    const destinationStudyStatsRecord = latestByUpdatedAt(destinationStudyStats);

    if (latestStudyStats && latestStudyStats.userKey !== destinationUserKey) {
      const nextStats = {
        userKey: destinationUserKey,
        currentStreak: latestStudyStats.currentStreak,
        longestStreak: latestStudyStats.longestStreak,
        weeklyActiveDays: latestStudyStats.weeklyActiveDays,
        lastStudiedDate: latestStudyStats.lastStudiedDate,
        updatedAt: latestStudyStats.updatedAt,
      };

      if (destinationStudyStatsRecord) {
        await ctx.db.patch(destinationStudyStatsRecord._id, nextStats);
      } else {
        await ctx.db.insert("studyStats", nextStats);
      }
      summary.studyStats = 1;
    }

    return summary;
  },
});
