import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { buildAuthoritativeCourseSelectionWrite } from "./lib/courseSelectionPolicy";
import {
  isLearnerVisibleCourseRecord,
  learnerCourseVisibilityOptions,
} from "./lib/courseWorkflow";
import {
  prepareLearnerDataMigration,
  selectDestinationAuthoritativeRecordForMigration,
  selectMonotonicLessonProgressForMigration,
} from "./lib/migrateLearnerData";

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

async function assertLearnerVisibleCourseIds(ctx: any, courseIds: readonly string[]) {
  for (const courseId of courseIds) {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_stable_id", (q: any) => q.eq("stableId", courseId))
      .first();

    if (!course || !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions)) {
      throw new Error(`Course is not available for learner selection: ${courseId}.`);
    }
  }
}

export const migrateLocalLearnerDataToAuthenticatedAccount = mutationGeneric({
  args: {
    sourceUserKey: v.string(),
  },
  handler: async (ctx, args): Promise<MigrationSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    const { sourceUserKey, destinationUserKey } = prepareLearnerDataMigration(identity, args.sourceUserKey);
    const now = Date.now();
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
    // or paid-access mechanism. Existing authenticated destination data remains
    // authoritative for singleton and per-lesson records.
    const sourceAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", sourceUserKey))
      .collect();
    const destinationAcademicProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", destinationUserKey))
      .collect();
    const selectedAcademicProfile = selectDestinationAuthoritativeRecordForMigration(
      sourceAcademicProfiles,
      destinationAcademicProfiles,
    );
    const destinationAcademicProfile = latestByUpdatedAt(destinationAcademicProfiles);

    if (selectedAcademicProfile && !destinationAcademicProfile) {
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
    const selectedCourseSelection = selectDestinationAuthoritativeRecordForMigration(
      sourceCourseSelections,
      destinationCourseSelections,
    );
    const destinationCourseSelection = latestByUpdatedAt(destinationCourseSelections);

    if (selectedCourseSelection && !destinationCourseSelection) {
      const nextCourseSelection = buildAuthoritativeCourseSelectionWrite({
        existing: null,
        requestedCourseIds: selectedCourseSelection.selectedCourseIds,
        now,
      });

      if (nextCourseSelection) {
        await assertLearnerVisibleCourseIds(ctx, nextCourseSelection.selectedCourseIds);
        await ctx.db.insert("courseSelections", {
          userKey: destinationUserKey,
          ...nextCourseSelection,
          updatedAt: now,
        });
        summary.courseSelections = 1;
      }
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
      const mergedProgress = selectMonotonicLessonProgressForMigration(
        [...sourceLessonProgress, ...destinationLessonProgress].filter((progress) => progress.lessonId === lessonId),
        destinationUserKey,
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
      const sourceNotesForLesson = sourceNotes.filter((note) => note.lessonId === lessonId);
      const destinationNotesForLesson = destinationNotes.filter((note) => note.lessonId === lessonId);
      const selectedNote = selectDestinationAuthoritativeRecordForMigration(
        sourceNotesForLesson,
        destinationNotesForLesson,
      );
      const destinationNote = latestByUpdatedAt(destinationNotesForLesson);

      if (!selectedNote || destinationNote) {
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
    const selectedStudyStats = selectDestinationAuthoritativeRecordForMigration(
      sourceStudyStats,
      destinationStudyStats,
    );
    const destinationStudyStatsRecord = latestByUpdatedAt(destinationStudyStats);

    if (selectedStudyStats && !destinationStudyStatsRecord) {
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

    return summary;
  },
});
