import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  getQuizAttemptMigrationFingerprint,
  prepareLearnerDataMigration,
  selectDestinationAuthoritativeMigrationRecord,
  selectMonotonicLessonProgressForMigration,
} from "./lib/migrateLearnerData";

const LEARNER_MIGRATION_VERSION = 1;

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

function latestByUpdatedAt<T extends { updatedAt: number }>(records: readonly T[]) {
  return [...records].sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
}

function summaryFromLedger(record: {
  sourceUserKey: string;
  destinationUserKey: string;
  academicProfiles: number;
  courseSelections: number;
  quizAttempts: number;
  lessonProgress: number;
  notes: number;
  studyStats: number;
}): MigrationSummary {
  return {
    sourceUserKey: record.sourceUserKey,
    destinationUserKey: record.destinationUserKey,
    academicProfiles: record.academicProfiles,
    courseSelections: record.courseSelections,
    quizAttempts: record.quizAttempts,
    lessonProgress: record.lessonProgress,
    notes: record.notes,
    studyStats: record.studyStats,
  };
}

export const migrateLocalLearnerDataToAuthenticatedAccount = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args): Promise<MigrationSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    const { sourceUserKey, destinationUserKey } = prepareLearnerDataMigration(identity, args.sourceUserKey);

    const existingLedger = await ctx.db
      .query("learnerMigrationLedger")
      .withIndex("by_source_destination_version", (q) =>
        q
          .eq("sourceUserKey", sourceUserKey)
          .eq("destinationUserKey", destinationUserKey)
          .eq("migrationVersion", LEARNER_MIGRATION_VERSION),
      )
      .first();

    if (existingLedger) {
      return summaryFromLedger(existingLedger);
    }

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

    // Local/free migration bridge only. Mutable singleton account state is
    // destination-authoritative once authenticated data exists. Append-only quiz
    // attempts and monotonic lesson progress can merge safely from the verified
    // local source belonging to the same authenticated email.
    const sourceAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const selectedAcademicProfile = selectDestinationAuthoritativeMigrationRecord(
      sourceAcademicProfiles,
      destinationAcademicProfiles,
    );

    if (selectedAcademicProfile && selectedAcademicProfile.userKey !== destinationUserKey) {
      await ctx.db.insert("academicProfiles", {
        userKey: destinationUserKey,
        educationLevel: selectedAcademicProfile.educationLevel,
        curriculumOrInstitution: selectedAcademicProfile.curriculumOrInstitution,
        gradeOrYear: selectedAcademicProfile.gradeOrYear,
        subjectsOrModules: selectedAcademicProfile.subjectsOrModules,
        updatedAt: selectedAcademicProfile.updatedAt,
      });
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
    const selectedCourseSelection = selectDestinationAuthoritativeMigrationRecord(
      sourceCourseSelections,
      destinationCourseSelections,
    );

    if (selectedCourseSelection && selectedCourseSelection.userKey !== destinationUserKey) {
      await ctx.db.insert("courseSelections", {
        userKey: destinationUserKey,
        selectedCourseIds: selectedCourseSelection.selectedCourseIds,
        selectedAt: selectedCourseSelection.selectedAt,
        gracePeriodEndsAt: selectedCourseSelection.gracePeriodEndsAt,
        lockedAt: selectedCourseSelection.lockedAt,
        locked: selectedCourseSelection.locked,
        updatedAt: selectedCourseSelection.updatedAt,
      });
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
    const destinationAttemptFingerprints = new Set(
      destinationQuizAttempts.map((attempt) => getQuizAttemptMigrationFingerprint(attempt)),
    );

    for (const sourceAttempt of sourceQuizAttempts) {
      const fingerprint = getQuizAttemptMigrationFingerprint(sourceAttempt);

      if (destinationAttemptFingerprints.has(fingerprint)) {
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
      destinationAttemptFingerprints.add(fingerprint);
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
      const mergedProgress = selectMonotonicLessonProgressForMigration(
        [...sourceLessonProgress, ...destinationLessonProgress].filter((progress) => progress.lessonId === lessonId),
      );
      const destinationProgress = latestByUpdatedAt(
        destinationLessonProgress.filter((progress) => progress.lessonId === lessonId),
      );

      if (!mergedProgress || mergedProgress.userKey === destinationUserKey) {
        continue;
      }

      const nextProgress = {
        userKey: destinationUserKey,
        lessonId: mergedProgress.lessonId,
        status: mergedProgress.status,
        progress: mergedProgress.progress,
        updatedAt: mergedProgress.updatedAt,
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
      const selectedNote = selectDestinationAuthoritativeMigrationRecord(
        sourceNotes.filter((note) => note.lessonId === lessonId),
        destinationNotes.filter((note) => note.lessonId === lessonId),
      );

      if (!selectedNote || selectedNote.userKey === destinationUserKey) {
        continue;
      }

      await ctx.db.insert("notes", {
        userKey: destinationUserKey,
        lessonId: selectedNote.lessonId,
        body: selectedNote.body,
        updatedAt: selectedNote.updatedAt,
      });
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
    const selectedStudyStats = selectDestinationAuthoritativeMigrationRecord(
      sourceStudyStats,
      destinationStudyStats,
    );

    if (selectedStudyStats && selectedStudyStats.userKey !== destinationUserKey) {
      await ctx.db.insert("studyStats", {
        userKey: destinationUserKey,
        currentStreak: selectedStudyStats.currentStreak,
        longestStreak: selectedStudyStats.longestStreak,
        weeklyActiveDays: selectedStudyStats.weeklyActiveDays,
        lastStudiedDate: selectedStudyStats.lastStudiedDate,
        updatedAt: selectedStudyStats.updatedAt,
      });
      summary.studyStats = 1;
    }

    await ctx.db.insert("learnerMigrationLedger", {
      sourceUserKey,
      destinationUserKey,
      migrationVersion: LEARNER_MIGRATION_VERSION,
      academicProfiles: summary.academicProfiles,
      courseSelections: summary.courseSelections,
      quizAttempts: summary.quizAttempts,
      lessonProgress: summary.lessonProgress,
      notes: summary.notes,
      studyStats: summary.studyStats,
      completedAt: Date.now(),
    });

    return summary;
  },
});
