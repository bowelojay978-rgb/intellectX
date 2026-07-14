import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  getLearnerMigrationAuditTargetId,
  getQuizAttemptMigrationFingerprint,
  mergeStudyStatsForMigration,
  prepareLearnerDataMigration,
  selectCourseSelectionForMigration,
  selectLatestUpdatedRecordForMigration,
  selectMonotonicLessonProgressForMigration,
} from "./lib/migrateLearnerData";

const MIGRATION_TARGET_TYPE = "learner_migration";
const MIGRATION_ATTEMPTED_EVENT = "learner_migration_attempted";
const MIGRATION_FAILED_EVENT = "learner_migration_failed";
const MIGRATION_COMPLETED_EVENT = "learner_migration_completed";

type MigrationSummary = {
  sourceUserKey: string;
  destinationUserKey: string;
  academicProfiles: number;
  courseSelections: number;
  quizAttempts: number;
  lessonProgress: number;
  notes: number;
  studyStats: number;
  alreadyCompleted: boolean;
};

function createMigrationSummary(
  sourceUserKey: string,
  destinationUserKey: string,
  alreadyCompleted = false,
): MigrationSummary {
  return {
    sourceUserKey,
    destinationUserKey,
    academicProfiles: 0,
    courseSelections: 0,
    quizAttempts: 0,
    lessonProgress: 0,
    notes: 0,
    studyStats: 0,
    alreadyCompleted,
  };
}

export const recordLocalLearnerMigrationAttempt = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const plan = prepareLearnerDataMigration(identity, args.sourceUserKey);
    const targetId = getLearnerMigrationAuditTargetId(plan);
    const completedEvent = await ctx.db
      .query("auditLogs")
      .withIndex("by_target_event", (q) =>
        q
          .eq("targetType", MIGRATION_TARGET_TYPE)
          .eq("targetId", targetId)
          .eq("eventType", MIGRATION_COMPLETED_EVENT),
      )
      .first();

    if (completedEvent) {
      return { alreadyCompleted: true };
    }

    await ctx.db.insert("auditLogs", {
      eventType: MIGRATION_ATTEMPTED_EVENT,
      actorUserId: plan.destinationUserKey,
      actorRole: "learner",
      targetType: MIGRATION_TARGET_TYPE,
      targetId,
      createdAt: Date.now(),
      before: { sourceUserKey: plan.sourceUserKey },
      after: { destinationUserKey: plan.destinationUserKey },
    });

    return { alreadyCompleted: false };
  },
});

export const recordLocalLearnerMigrationFailure = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const plan = prepareLearnerDataMigration(identity, args.sourceUserKey);
    const targetId = getLearnerMigrationAuditTargetId(plan);
    const completedEvent = await ctx.db
      .query("auditLogs")
      .withIndex("by_target_event", (q) =>
        q
          .eq("targetType", MIGRATION_TARGET_TYPE)
          .eq("targetId", targetId)
          .eq("eventType", MIGRATION_COMPLETED_EVENT),
      )
      .first();

    if (completedEvent) {
      return { alreadyCompleted: true };
    }

    await ctx.db.insert("auditLogs", {
      eventType: MIGRATION_FAILED_EVENT,
      actorUserId: plan.destinationUserKey,
      actorRole: "learner",
      targetType: MIGRATION_TARGET_TYPE,
      targetId,
      createdAt: Date.now(),
      reason: "migration_mutation_failed",
      before: { sourceUserKey: plan.sourceUserKey },
      after: { destinationUserKey: plan.destinationUserKey },
    });

    return { alreadyCompleted: false };
  },
});

export const migrateLocalLearnerDataToAuthenticatedAccount = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args): Promise<MigrationSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    const { sourceUserKey, destinationUserKey } = prepareLearnerDataMigration(identity, args.sourceUserKey);
    const targetId = getLearnerMigrationAuditTargetId({ sourceUserKey, destinationUserKey });
    const completedEvent = await ctx.db
      .query("auditLogs")
      .withIndex("by_target_event", (q) =>
        q
          .eq("targetType", MIGRATION_TARGET_TYPE)
          .eq("targetId", targetId)
          .eq("eventType", MIGRATION_COMPLETED_EVENT),
      )
      .first();

    if (completedEvent) {
      return createMigrationSummary(sourceUserKey, destinationUserKey, true);
    }

    const summary = createMigrationSummary(sourceUserKey, destinationUserKey);

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
    const latestAcademicProfile = selectLatestUpdatedRecordForMigration(
      [...sourceAcademicProfiles, ...destinationAcademicProfiles],
      destinationUserKey,
    );
    const destinationAcademicProfile = selectLatestUpdatedRecordForMigration(
      destinationAcademicProfiles,
      destinationUserKey,
    );

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
    const selectedCourseSelection = selectCourseSelectionForMigration(
      [...sourceCourseSelections, ...destinationCourseSelections],
      destinationUserKey,
    );
    const destinationCourseSelection = selectLatestUpdatedRecordForMigration(
      destinationCourseSelections,
      destinationUserKey,
    );

    if (selectedCourseSelection && selectedCourseSelection.userKey !== destinationUserKey) {
      const nextSelection = {
        userKey: destinationUserKey,
        selectedCourseIds: selectedCourseSelection.selectedCourseIds,
        selectedAt: selectedCourseSelection.selectedAt,
        gracePeriodEndsAt: selectedCourseSelection.gracePeriodEndsAt,
        lockedAt: selectedCourseSelection.lockedAt,
        locked: selectedCourseSelection.locked,
        updatedAt: selectedCourseSelection.updatedAt,
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
    const destinationAttemptFingerprints = new Set(
      destinationQuizAttempts.map(getQuizAttemptMigrationFingerprint),
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
      const destinationProgress = destinationLessonProgress.find((progress) => progress.lessonId === lessonId);

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
      const latestNote = selectLatestUpdatedRecordForMigration(
        [...sourceNotes, ...destinationNotes].filter((note) => note.lessonId === lessonId),
        destinationUserKey,
      );
      const destinationNote = selectLatestUpdatedRecordForMigration(
        destinationNotes.filter((note) => note.lessonId === lessonId),
        destinationUserKey,
      );

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
    const mergedStudyStats = mergeStudyStatsForMigration(
      sourceStudyStats,
      destinationStudyStats,
      destinationUserKey,
    );
    const destinationStudyStatsRecord = selectLatestUpdatedRecordForMigration(
      destinationStudyStats,
      destinationUserKey,
    );
    const shouldWriteStudyStats = Boolean(
      mergedStudyStats &&
        (!destinationStudyStatsRecord ||
          mergedStudyStats.currentStreak !== destinationStudyStatsRecord.currentStreak ||
          mergedStudyStats.longestStreak !== destinationStudyStatsRecord.longestStreak ||
          mergedStudyStats.lastStudiedDate !== destinationStudyStatsRecord.lastStudiedDate ||
          mergedStudyStats.updatedAt !== destinationStudyStatsRecord.updatedAt ||
          JSON.stringify(mergedStudyStats.weeklyActiveDays) !==
            JSON.stringify(destinationStudyStatsRecord.weeklyActiveDays)),
    );

    if (mergedStudyStats && shouldWriteStudyStats) {
      const nextStats = {
        userKey: destinationUserKey,
        currentStreak: mergedStudyStats.currentStreak,
        longestStreak: mergedStudyStats.longestStreak,
        weeklyActiveDays: mergedStudyStats.weeklyActiveDays,
        lastStudiedDate: mergedStudyStats.lastStudiedDate,
        updatedAt: mergedStudyStats.updatedAt,
      };

      if (destinationStudyStatsRecord) {
        await ctx.db.patch(destinationStudyStatsRecord._id, nextStats);
      } else {
        await ctx.db.insert("studyStats", nextStats);
      }
      summary.studyStats = 1;
    }

    await ctx.db.insert("auditLogs", {
      eventType: MIGRATION_COMPLETED_EVENT,
      actorUserId: destinationUserKey,
      actorRole: "learner",
      targetType: MIGRATION_TARGET_TYPE,
      targetId,
      createdAt: Date.now(),
      before: { sourceUserKey },
      after: { destinationUserKey, summary },
    });

    return summary;
  },
});
