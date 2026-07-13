"use client";

import { convexApi } from "@/lib/convex-api";
import {
  getCurrentConvexLearnerIdentity,
  type ConvexLearnerArgs,
  type ConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
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

  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

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
      if (currentIdentity.source === "authenticated-convex" && hasPendingLocalLearnerMigrationSource()) {
        return;
      }

      upsertCourseSelection(persistCourseSelectionArgs(identityArgs, loadCourseSelection())).catch((error) => {
        console.warn("Unable to sync course selection to Convex", error);
      });
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
              hasPendingLocalLearnerMigrationSource(),
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
          hydrateAuthenticatedCourseSelection(null, hasPendingLocalLearnerMigrationSource());
          window.setTimeout(() => {
            syncingRemoteToLocal.current = false;
          }, 0);
          return;
        }

        const localSelection = loadCourseSelection();
        if (localSelection.selectedCourseIds.length > 0) {
          upsertCourseSelection(persistCourseSelectionArgs(identityArgs, localSelection)).catch((error) => {
            console.warn("Unable to sync local course selection to Convex", error);
          });
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
  }, [convex, identity, upsertCourseSelection]);

  useEffect(() => {
    function syncLocalSelectionToConvex() {
      if (syncingRemoteToLocal.current) {
        return;
      }

      localEditVersion.current += 1;

      if (!identity || !remoteHydrated.current) return;

      if (identity.source === "authenticated-convex" && hasPendingLocalLearnerMigrationSource()) {
        return;
      }

      const identityArgs = getIdentityArgs(identity);
      upsertCourseSelection(persistCourseSelectionArgs(identityArgs, loadCourseSelection())).catch((error) => {
        console.warn("Unable to sync course selection to Convex", error);
      });
    }

    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);
    };
  }, [identity, upsertCourseSelection]);

  return null;
}
