import type { UserIdentity } from "convex/server";
import { getAuthenticatedLearnerUserKey } from "./identity";
import { mergeStudyStatsSnapshot, type StudyStatsSnapshot } from "./studyStats";

export const AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER = "auth:convex-authenticated-user";
const localLearnerUserKeyPattern = /^learner:[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getLocalLearnerEmailFromUserKey(userKey: string) {
  return normalizeEmail(userKey.slice("learner:".length));
}

export type LearnerDataMigrationPlan = {
  sourceUserKey: string;
  destinationUserKey: string;
};

export type UpdatedAtMigrationCandidate = {
  userKey: string;
  updatedAt: number;
};

export type LessonProgressMigrationCandidate = UpdatedAtMigrationCandidate & {
  lessonId: string;
  status: string;
  progress: number;
};

export type CourseSelectionMigrationCandidate = UpdatedAtMigrationCandidate & {
  selectedCourseIds: string[];
  selectedAt: number | null;
  gracePeriodEndsAt: number | null;
  lockedAt: number | null;
  locked: boolean;
};

export type QuizAttemptMigrationCandidate = {
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: number[];
  completedAt: number;
};

export type StudyStatsMigrationCandidate = UpdatedAtMigrationCandidate & StudyStatsSnapshot;

function normalizeLessonProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 100);
}

export function selectLatestUpdatedRecordForMigration<T extends UpdatedAtMigrationCandidate>(
  records: readonly T[],
  destinationUserKey: string,
): T | null {
  let selected: T | null = null;

  for (const record of records) {
    if (
      !selected ||
      record.updatedAt > selected.updatedAt ||
      (record.updatedAt === selected.updatedAt &&
        record.userKey === destinationUserKey &&
        selected.userKey !== destinationUserKey)
    ) {
      selected = record;
    }
  }

  return selected;
}

export function selectCourseSelectionForMigration(
  records: readonly CourseSelectionMigrationCandidate[],
  destinationUserKey: string,
): CourseSelectionMigrationCandidate | null {
  const lockedRecords = records.filter((record) => record.locked || record.lockedAt !== null);
  const candidates = lockedRecords.length > 0 ? lockedRecords : records;

  return selectLatestUpdatedRecordForMigration(candidates, destinationUserKey);
}

export function getQuizAttemptMigrationFingerprint(attempt: QuizAttemptMigrationCandidate) {
  return JSON.stringify([
    attempt.quizId,
    attempt.completedAt,
    attempt.score,
    attempt.totalQuestions,
    attempt.answers,
  ]);
}

export function mergeStudyStatsForMigration(
  sourceRecords: readonly StudyStatsMigrationCandidate[],
  destinationRecords: readonly StudyStatsMigrationCandidate[],
  destinationUserKey: string,
): StudyStatsMigrationCandidate | null {
  const latestSource = selectLatestUpdatedRecordForMigration(sourceRecords, destinationUserKey);
  const latestDestination = selectLatestUpdatedRecordForMigration(destinationRecords, destinationUserKey);

  if (!latestSource) {
    return latestDestination;
  }

  if (!latestDestination) {
    return {
      ...latestSource,
      userKey: destinationUserKey,
    };
  }

  const merged = mergeStudyStatsSnapshot(latestDestination, latestSource);

  return {
    userKey: destinationUserKey,
    ...merged,
    updatedAt: Math.max(latestSource.updatedAt, latestDestination.updatedAt),
  };
}

export function getLearnerMigrationAuditTargetId(plan: LearnerDataMigrationPlan) {
  return `${plan.sourceUserKey}=>${plan.destinationUserKey}`;
}

export function selectMonotonicLessonProgressForMigration(
  records: readonly LessonProgressMigrationCandidate[],
): LessonProgressMigrationCandidate | null {
  let selected: LessonProgressMigrationCandidate | null = null;

  for (const record of records) {
    const progress = normalizeLessonProgress(record.progress);
    const normalized = {
      ...record,
      progress,
      status: progress >= 100 ? "completed" : record.status,
    };

    if (
      !selected ||
      normalized.progress > selected.progress ||
      (normalized.progress === selected.progress && normalized.updatedAt > selected.updatedAt)
    ) {
      selected = normalized;
    }
  }

  return selected;
}

export function isLocalLearnerMigrationSourceUserKey(userKey: string | null | undefined) {
  const trimmedUserKey = userKey?.trim();

  return Boolean(trimmedUserKey && localLearnerUserKeyPattern.test(trimmedUserKey));
}

export function prepareLearnerDataMigration(
  identity: UserIdentity | null,
  sourceUserKey: string | null | undefined,
): LearnerDataMigrationPlan {
  if (!identity) {
    throw new Error("Authenticated Convex identity is required to migrate learner data.");
  }

  const trimmedSourceUserKey = sourceUserKey?.trim();

  if (!trimmedSourceUserKey) {
    throw new Error("A local learner source userKey is required to migrate learner data.");
  }

  const destinationUserKey = getAuthenticatedLearnerUserKey(identity);

  if (trimmedSourceUserKey === destinationUserKey) {
    throw new Error("Learner migration source and destination user keys must be different.");
  }

  if (trimmedSourceUserKey === AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER) {
    throw new Error("The authenticated Convex compatibility placeholder cannot be used as a migration source.");
  }

  if (trimmedSourceUserKey.startsWith("auth:")) {
    throw new Error("Authenticated learner user keys cannot be used as local migration sources.");
  }

  if (!isLocalLearnerMigrationSourceUserKey(trimmedSourceUserKey)) {
    throw new Error("Migration source userKey must be a local learner key.");
  }

  const authenticatedEmail = typeof identity.email === "string" ? normalizeEmail(identity.email) : "";

  if (!authenticatedEmail) {
    throw new Error("Authenticated account email is required to migrate local learner data.");
  }

  const sourceEmail = getLocalLearnerEmailFromUserKey(trimmedSourceUserKey);

  if (sourceEmail !== authenticatedEmail) {
    throw new Error("Migration source must belong to the authenticated account email.");
  }

  return {
    sourceUserKey: trimmedSourceUserKey,
    destinationUserKey,
  };
}
