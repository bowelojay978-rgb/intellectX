"use client";

import { convexApi } from "@/lib/convex-api";
import { getCurrentLearnerIdentity } from "@/lib/learner-session";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

type LocalLearnerDataMigrationSyncProps = {
  isAuthLoaded: boolean;
  isSignedIn: boolean | undefined;
};

export function LocalLearnerDataMigrationSync({ isAuthLoaded, isSignedIn }: LocalLearnerDataMigrationSyncProps) {
  const attemptedSourceKey = useRef<string | null>(null);
  const migrateLocalLearnerData = useMutation(
    convexApi.learnerMigration.migrateLocalLearnerDataToAuthenticatedAccount,
  );

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }

    const localIdentity = getCurrentLearnerIdentity();

    if (!localIdentity?.userKey) {
      return;
    }

    if (attemptedSourceKey.current === localIdentity.userKey) {
      return;
    }

    attemptedSourceKey.current = localIdentity.userKey;
    migrateLocalLearnerData({ sourceUserKey: localIdentity.userKey }).catch((error) => {
      attemptedSourceKey.current = null;
      console.warn("Unable to migrate local learner data to authenticated account", error);
    });
  }, [isAuthLoaded, isSignedIn, migrateLocalLearnerData]);

  return null;
}
