import type { UserIdentity } from "convex/server";
import { getAuthenticatedLearnerUserKey } from "./identity";

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

export type LessonProgressMigrationCandidate = {
  userKey: string;
  lessonId: string;
  status: string;
  progress: number;
  updatedAt: number;
};

export type QuizAttemptMigrationCandidate = {
  quizId: string;
  completedAt: number;
  score: number;
  totalQuestions: number;
  answers: readonly number[];
};

export type DestinationAuthoritativeMigrationCandidate = {
  userKey: string;
  updatedAt: number;
};

function latestByUpdatedAt<T extends { updatedAt: number }>(records: readonly T[]) {
  return [...records].sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
}

function normalizeLessonProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 100);
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

export function selectDestinationAuthoritativeMigrationRecord<
  T extends DestinationAuthoritativeMigrationCandidate,
>(sourceRecords: readonly T[], destinationRecords: readonly T[]): T | null {
  return latestByUpdatedAt(destinationRecords) ?? latestByUpdatedAt(sourceRecords);
}

export function getQuizAttemptMigrationFingerprint(attempt: QuizAttemptMigrationCandidate) {
  return JSON.stringify([
    attempt.quizId,
    attempt.completedAt,
    attempt.score,
    attempt.totalQuestions,
    [...attempt.answers],
  ]);
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
