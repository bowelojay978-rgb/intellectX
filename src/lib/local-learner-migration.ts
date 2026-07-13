"use client";

import { AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER } from "@/lib/convex-learner-identity";
import type { AuthEnvironmentMode } from "@/lib/auth-env";
import type { LearnerIdentity } from "@/lib/learner-session";

const LOCAL_LEARNER_MIGRATION_MARKER_PREFIX = "intellectx:local-auth-migration";
const localLearnerUserKeyPattern = /^learner:[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LocalLearnerMigrationMarkerStatus = "attempted" | "failed" | "succeeded";

export type LocalLearnerMigrationSource = {
  sourceUserKey: string;
  markerKey: string;
};

type ResolveLocalLearnerMigrationSourceArgs = {
  localIdentity: Pick<LearnerIdentity, "userKey"> | null | undefined;
  authMode: AuthEnvironmentMode;
  authenticatedEmail?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getLocalLearnerEmailFromUserKey(userKey: string) {
  return normalizeEmail(userKey.slice("learner:".length));
}

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
  authenticatedEmail,
}: ResolveLocalLearnerMigrationSourceArgs): LocalLearnerMigrationSource | null {
  const sourceUserKey = localIdentity?.userKey?.trim();

  if (!sourceUserKey || sourceUserKey === AUTHENTICATED_CONVEX_USER_KEY_PLACEHOLDER) {
    return null;
  }

  if (sourceUserKey.startsWith("auth:") || !isLocalLearnerMigrationSourceUserKey(sourceUserKey)) {
    return null;
  }

  if (authenticatedEmail !== undefined) {
    const normalizedAuthenticatedEmail = normalizeEmail(authenticatedEmail ?? "");

    if (!normalizedAuthenticatedEmail || getLocalLearnerEmailFromUserKey(sourceUserKey) !== normalizedAuthenticatedEmail) {
      return null;
    }
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

  return marker === "attempted" || marker === "failed" || marker === "succeeded" ? marker : null;
}

export function hasCompletedLocalLearnerMigration(
  markerKey: string,
  storage: Pick<Storage, "getItem"> = window.localStorage,
) {
  return readLocalLearnerMigrationMarker(markerKey, storage) === "succeeded";
}

export function writeLocalLearnerMigrationMarker(
  markerKey: string,
  status: LocalLearnerMigrationMarkerStatus,
  storage: Pick<Storage, "setItem"> = window.localStorage,
) {
  storage.setItem(markerKey, status);
}
