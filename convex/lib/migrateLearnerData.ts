import type { UserIdentity } from "convex/server";
import { getAuthenticatedLearnerUserKey } from "./identity";

export const AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER = "auth:convex-authenticated-user";
const localLearnerUserKeyPattern = /^learner:[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LearnerDataMigrationPlan = {
  sourceUserKey: string;
  destinationUserKey: string;
};

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

  return {
    sourceUserKey: trimmedSourceUserKey,
    destinationUserKey,
  };
}
