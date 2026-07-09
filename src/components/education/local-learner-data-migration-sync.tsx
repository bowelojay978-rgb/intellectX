"use client";

import { convexApi } from "@/lib/convex-api";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { getCurrentLearnerIdentity } from "@/lib/learner-session";
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
};

export function LocalLearnerDataMigrationSync({ isAuthLoaded, isSignedIn }: LocalLearnerDataMigrationSyncProps) {
  const attemptedMarkerKey = useRef<string | null>(null);
  const migrateLocalLearnerData = useMutation(
    convexApi.learnerMigration.migrateLocalLearnerDataToAuthenticatedAccount,
  );

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }

    const authEnvironment = getAuthEnvironmentStatus();
    const migrationSource = resolveLocalLearnerMigrationSource({
      localIdentity: getCurrentLearnerIdentity(),
      authMode: authEnvironment.mode,
    });

    if (!migrationSource) {
      return;
    }

    if (attemptedMarkerKey.current === migrationSource.markerKey) {
      return;
    }

    if (hasCompletedLocalLearnerMigration(migrationSource.markerKey)) {
      return;
    }

    attemptedMarkerKey.current = migrationSource.markerKey;
    writeLocalLearnerMigrationMarker(migrationSource.markerKey, "attempted");

    migrateLocalLearnerData({ sourceUserKey: migrationSource.sourceUserKey })
      .then(() => {
        writeLocalLearnerMigrationMarker(migrationSource.markerKey, "succeeded");
      })
      .catch((error) => {
        console.warn("Unable to migrate local learner data to authenticated account", error);
        writeLocalLearnerMigrationMarker(migrationSource.markerKey, "failed");
      });
  }, [isAuthLoaded, isSignedIn, migrateLocalLearnerData]);

  return null;
}
