import type { UserIdentity } from "convex/server";
import { getAuthenticatedLearnerUserKey } from "./identity";

export type LearnerDataMigrationPlan = {
  sourceUserKey: string;
  destinationUserKey: string;
};

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

  return {
    sourceUserKey: trimmedSourceUserKey,
    destinationUserKey,
  };
}
