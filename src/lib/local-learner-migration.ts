"use client";

import { AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER } from "@/lib/convex-learner-identity";
import type { AuthEnvironmentMode } from "@/lib/auth-env";
import type { LearnerIdentity } from "@/lib/learner-session";

const LOCAL_LEARNER_MIGRATION_MARKER_PREFIX = "intellectx:local-auth-migration";
const localLearnerUserKeyPattern = /^learner:[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LocalLearnerMigrationMarkerStatus = "attempted" | "succeeded";

export type LocalLearnerMigrationSource = {
  sourceUserKey: string;
  markerKey: string;
};

type ResolveLocalLearnerMigrationSourceArgs = {
  localIdentity: Pick<LearnerIdentity, "userKey"> | null | undefined;
  authMode: AuthEnvironmentMode;
};

export function isLocalLearnerMigrationSourceUserKey(userKey: string | null | undefined) {
  const trimmedUserKey = userKey?.trim();

  return Boolean(trimmedUserKey && localLearnerUserKeyPattern.test(trimmedUserKey));
}

export function getLocalLearnerMigrationMarkerKey(authMode: AuthEnvironmentMode, sourceUserKey: string) {
  return `${LOCAL_LEARNER_MIGRATION_MARKER_PREFIX}:${authMode}:${sourceUserKey}`;
}

export function resolveLocalLearnerMigrationSource({
  localIdentity,
  authMode,
}: ResolveLocalLearnerMigrationSourceArgs): LocalLearnerMigrationSource | null {
  const sourceUserKey = localIdentity?.userKey?.trim();

  if (!sourceUserKey || sourceUserKey === AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER) {
    return null;
  }

  if (sourceUserKey.startsWith("auth:") || !isLocalLearnerMigrationSourceUserKey(sourceUserKey)) {
    return null;
  }

  return {
    sourceUserKey,
    markerKey: getLocalLearnerMigrationMarkerKey(authMode, sourceUserKey),
  };
}

export function readLocalLearnerMigrationMarker(
  markerKey: string,
  storage: Pick<Storage, "getItem"> = window.localStorage,
): LocalLearnerMigrationMarkerStatus | null {
  const marker = storage.getItem(markerKey);

  return marker === "attempted" || marker === "succeeded" ? marker : null;
}

export function writeLocalLearnerMigrationMarker(
  markerKey: string,
  status: LocalLearnerMigrationMarkerStatus,
  storage: Pick<Storage, "setItem"> = window.localStorage,
) {
  storage.setItem(markerKey, status);
}
