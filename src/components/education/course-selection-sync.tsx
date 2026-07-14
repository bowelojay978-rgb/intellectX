"use client";

import { convexApi } from "@/lib/convex-api";
import {
  getCurrentConvexLearnerIdentity,
  type ConvexLearnerArgs,
  type ConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  COURSE_SELECTION_SYNC_RETRY_EVENT,
  type CourseSelection,
  dispatchCourseSelectionSyncStatus,
  loadCourseSelection,
  normalizeCourseSelection,
  saveCourseSelection,
} from "@/lib/course-selection";
import { convexEnv } from "@/lib/education-data";
import { hasPendingLocalLearnerMigrationSource } from "@/lib/authenticated-learner-local-data";
import { hydrateAuthenticatedCourseSelection } from "@/lib/authenticated-learner-hydration";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import { hasNewerLocalEdit } from "@/lib/learner-hydration-version";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";

type StoredCourseSelection = CourseSelection & {
  userKey?: string;
};

function courseSelectionsMatch(left: CourseSelection, right: CourseSelection) {
  return (
    left.locked === right.locked &&
    left.selectedAt === right.selectedAt &&
    left.gracePeriodEndsAt === right.gracePeriodEndsAt &&
    left.lockedAt === right.lockedAt &&
    left.selectedCourseIds.length === right.selectedCourseIds.length &&
    left.selectedCourseIds.every((courseId, index) => courseId === right.selectedCourseIds[index])
  );
}

function persistCourseSelectionArgs(identityArgs: ConvexLearnerArgs, selection: CourseSelection) {
  const normalizedSelection = normalizeCourseSelection(selection);

  return {
    ...identityArgs,
    selectedCourseIds: normalizedSelection.selectedCourseIds,
    selectedAt: normalizedSelection.selectedAt,
    gracePeriodEndsAt: normalizedSelection.gracePeriodEndsAt,
    lockedAt: normalizedSelection.lockedAt,
    locked: normalizedSelection.locked,
  };
}

function getIdentityArgs(identity: ConvexLearnerIdentity): ConvexLearnerArgs {
  return identity.userKey ? { userKey: identity.userKey } : {};
}

function trackCourseSelectionSync(operation: Promise<unknown>, warningMessage: string) {
  dispatchCourseSelectionSyncStatus("pending");

  operation
    .then(() => {
      dispatchCourseSelectionSyncStatus("success");
    })
    .catch((error) => {
      dispatchCourseSelectionSyncStatus("error");
      console.warn(warningMessage, error);
    });
}

export function CourseSelectionSync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexCourseSelectionSync />;
}

function ConvexCourseSelectionSync() {
  const convex = useConvex();
  const [identity, setIdentity] = useState<ConvexLearnerIdentity | null>(null);
  const upsertCourseSelection = useMutation(convexApi.courseSelections.upsertCourseSelection);
  const remoteHydrated = useRef(false);
  const syncingRemoteToLocal = useRef(false);
  const localEditVersion = useRef(0);

  const { isLoaded, isSignedIn, userId, primaryEmailAddress } = useLearnerAuthRuntime();

  useEffect(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));

    function syncIdentity() {
      const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
      setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));
      remoteHydrated.current = false;
    }

    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    const currentIdentity = identity;
    let cancelled = false;
    const identityArgs = getIdentityArgs(currentIdentity);
    const hydrationStartedAtVersion = localEditVersion.current;

    function persistCurrentLocalSelection() {
      if (
        currentIdentity.source === "authenticated-convex" &&
        hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress })
      ) {
        return;
      }

      trackCourseSelectionSync(
        upsertCourseSelection(persistCourseSelectionArgs(identityArgs, loadCourseSelection())),
        "Unable to sync course selection to Convex",
      );
    }

    convex
      .query(convexApi.courseSelections.getCourseSelection, identityArgs)
      .then((remoteSelection) => {
        if (cancelled) return;

        remoteHydrated.current = true;

        if (hasNewerLocalEdit(hydrationStartedAtVersion, localEditVersion.current)) {
          persistCurrentLocalSelection();
          return;
        }

        if (remoteSelection) {
          const normalizedRemoteSelection = normalizeCourseSelection(remoteSelection as StoredCourseSelection);

          if (currentIdentity.source === "authenticated-convex") {
            syncingRemoteToLocal.current = true;
            hydrateAuthenticatedCourseSelection(
              normalizedRemoteSelection,
              hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress }),
            );
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
            return;
          }

          const localSelection = loadCourseSelection();
          if (!courseSelectionsMatch(normalizedRemoteSelection, localSelection)) {
            syncingRemoteToLocal.current = true;
            saveCourseSelection(normalizedRemoteSelection);
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
          }

          return;
        }

        if (currentIdentity.source === "authenticated-convex") {
          syncingRemoteToLocal.current = true;
          hydrateAuthenticatedCourseSelection(
            null,
            hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress }),
          );
          window.setTimeout(() => {
            syncingRemoteToLocal.current = false;
          }, 0);
          return;
        }

        const localSelection = loadCourseSelection();
        if (localSelection.selectedCourseIds.length > 0) {
          trackCourseSelectionSync(
            upsertCourseSelection(persistCourseSelectionArgs(identityArgs, localSelection)),
            "Unable to sync local course selection to Convex",
          );
        }
      })
      .catch((error) => {
        if (cancelled) return;

        remoteHydrated.current = false;
        console.warn("Unable to load course selection from Convex", error);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, identity, primaryEmailAddress, upsertCourseSelection]);

  useEffect(() => {
    function syncLocalSelectionToConvex() {
      if (syncingRemoteToLocal.current) {
        return;
      }

      localEditVersion.current += 1;

      if (!identity || !remoteHydrated.current) return;

      if (
        identity.source === "authenticated-convex" &&
        hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress })
      ) {
        return;
      }

      const identityArgs = getIdentityArgs(identity);
      trackCourseSelectionSync(
        upsertCourseSelection(persistCourseSelectionArgs(identityArgs, loadCourseSelection())),
        "Unable to sync course selection to Convex",
      );
    }

    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);
    window.addEventListener(COURSE_SELECTION_SYNC_RETRY_EVENT, syncLocalSelectionToConvex);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);
      window.removeEventListener(COURSE_SELECTION_SYNC_RETRY_EVENT, syncLocalSelectionToConvex);
    };
  }, [identity, primaryEmailAddress, upsertCourseSelection]);

  return null;
}
