"use client";

import { clearAcademicProfile } from "@/lib/academic-profile";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { clearCourseSelection } from "@/lib/course-selection";
import { getCurrentLearnerIdentity } from "@/lib/learner-session";
import { clearLessonProgressHistory } from "@/lib/lesson-progress-history";
import {
  hasCompletedLocalLearnerMigration,
  resolveLocalLearnerMigrationSource,
} from "@/lib/local-learner-migration";
import { clearQuizAttemptHistory } from "@/lib/quiz-attempt-history";

export const ACTIVE_CLERK_LEARNER_USER_KEY = "intellectx:active-clerk-learner-user";

export type AuthenticatedLearnerTransition = {
  previousUserId: string | null;
  nextUserId: string | null;
  hasMigrationSource: boolean;
};

type PendingMigrationSourceOptions = {
  authenticatedEmail: string | null;
};

export function shouldClearAuthenticatedLearnerLocalDataForTransition({
  previousUserId,
  nextUserId,
  hasMigrationSource,
}: AuthenticatedLearnerTransition) {
  return Boolean(nextUserId && previousUserId !== nextUserId && !hasMigrationSource);
}

export function hasPendingLocalLearnerMigrationSource(options?: PendingMigrationSourceOptions) {
  const authEnvironment = getAuthEnvironmentStatus();
  const migrationSource = resolveLocalLearnerMigrationSource({
    localIdentity: getCurrentLearnerIdentity(),
    authMode: authEnvironment.mode,
    ...(options ? { authenticatedEmail: options.authenticatedEmail } : {}),
  });

  return Boolean(migrationSource && !hasCompletedLocalLearnerMigration(migrationSource.markerKey));
}

export function readActiveClerkLearnerUserId(storage: Pick<Storage, "getItem"> = window.localStorage) {
  return storage.getItem(ACTIVE_CLERK_LEARNER_USER_KEY);
}

export function writeActiveClerkLearnerUserId(
  userId: string,
  storage: Pick<Storage, "setItem"> = window.localStorage,
) {
  storage.setItem(ACTIVE_CLERK_LEARNER_USER_KEY, userId);
}

export function clearAuthenticatedLearnerLocalData() {
  clearAcademicProfile();
  clearCourseSelection();
  clearQuizAttemptHistory();
  clearLessonProgressHistory();
}
