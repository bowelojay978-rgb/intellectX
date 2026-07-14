"use client";

import { convexApi } from "@/lib/convex-api";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { clearLearnerSession, getCurrentLearnerIdentity } from "@/lib/learner-session";
import {
  hasCompletedLocalLearnerMigration,
  resolveLocalLearnerMigrationSource,
  writeLocalLearnerMigrationMarker,
} from "@/lib/local-learner-migration";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

type LocalLearnerDataMigrationSyncProps = {
  isAuthLoaded: boolean;
  isSignedIn: boolean | undefined;
  authenticatedUserId: string | null;
  authenticatedEmail: string | null;
};

export function LocalLearnerDataMigrationSync({
  isAuthLoaded,
  isSignedIn,
  authenticatedUserId,
  authenticatedEmail,
}: LocalLearnerDataMigrationSyncProps) {
  const attemptedMarkerKey = useRef<string | null>(null);
  const recordMigrationAttempt = useMutation(
    convexApi.learnerMigration.recordLocalLearnerMigrationAttempt,
  );
  const recordMigrationFailure = useMutation(
    convexApi.learnerMigration.recordLocalLearnerMigrationFailure,
  );
  const migrateLocalLearnerData = useMutation(
    convexApi.learnerMigration.migrateLocalLearnerDataToAuthenticatedAccount,
  );

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn || !authenticatedUserId) {
      return;
    }

    const authEnvironment = getAuthEnvironmentStatus();
    const migrationSource = resolveLocalLearnerMigrationSource({
      localIdentity: getCurrentLearnerIdentity(),
      authMode: authEnvironment.mode,
      authenticatedEmail,
    });

    if (!migrationSource) {
      return;
    }

    const attemptKey = `${authenticatedUserId}:${migrationSource.markerKey}`;

    if (attemptedMarkerKey.current === attemptKey) {
      return;
    }

    if (hasCompletedLocalLearnerMigration(migrationSource.markerKey)) {
      return;
    }

    attemptedMarkerKey.current = attemptKey;
    writeLocalLearnerMigrationMarker(migrationSource.markerKey, "attempted");

    let cancelled = false;

    async function runMigration() {
      try {
        const attempt = await recordMigrationAttempt({
          sourceUserKey: migrationSource.sourceUserKey,
        });

        if (cancelled) return;

        if (attempt?.alreadyCompleted) {
          writeLocalLearnerMigrationMarker(migrationSource.markerKey, "succeeded");
          clearLearnerSession();
          return;
        }

        await migrateLocalLearnerData({ sourceUserKey: migrationSource.sourceUserKey });

        if (cancelled) return;

        writeLocalLearnerMigrationMarker(migrationSource.markerKey, "succeeded");
        clearLearnerSession();
      } catch (error) {
        if (cancelled) return;

        console.warn("Unable to migrate local learner data to authenticated account", error);
        writeLocalLearnerMigrationMarker(migrationSource.markerKey, "failed");

        try {
          await recordMigrationFailure({ sourceUserKey: migrationSource.sourceUserKey });
        } catch (auditError) {
          console.warn("Unable to persist learner migration failure audit", auditError);
        }
      }
    }

    void runMigration();

    return () => {
      cancelled = true;
    };
  }, [
    authenticatedEmail,
    authenticatedUserId,
    isAuthLoaded,
    isSignedIn,
    migrateLocalLearnerData,
    recordMigrationAttempt,
    recordMigrationFailure,
  ]);

  return null;
}
