"use client";

import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs, type ConvexLearnerArgs } from "@/lib/convex-learner-identity";
import {
  COURSE_SELECTION_CHANGE_EVENT,
  type CourseSelection,
  loadCourseSelection,
  normalizeCourseSelection,
  saveCourseSelection,
} from "@/lib/course-selection";
import { convexEnv } from "@/lib/education-data";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
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

export function CourseSelectionSync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexCourseSelectionSync />;
}

function ConvexCourseSelectionSync() {
  const convex = useConvex();
  const [identityArgs, setIdentityArgs] = useState<ConvexLearnerArgs | null>(null);
  const upsertCourseSelection = useMutation(convexApi.courseSelections.upsertCourseSelection);
  const remoteHydrated = useRef(false);
  const syncingRemoteToLocal = useRef(false);

  useEffect(() => {
    setIdentityArgs(getCurrentConvexLearnerArgs());

    function syncIdentity() {
      setIdentityArgs(getCurrentConvexLearnerArgs());
      remoteHydrated.current = false;
    }

    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, []);

  useEffect(() => {
    if (!identityArgs) {
      return;
    }

    let cancelled = false;

    convex
      .query(convexApi.courseSelections.getCourseSelection, identityArgs)
      .then((remoteSelection) => {
        if (cancelled) return;

        if (remoteSelection) {
          const normalizedRemoteSelection = normalizeCourseSelection(remoteSelection as StoredCourseSelection);
          const localSelection = loadCourseSelection();

          remoteHydrated.current = true;

          if (!courseSelectionsMatch(normalizedRemoteSelection, localSelection)) {
            syncingRemoteToLocal.current = true;
            saveCourseSelection(normalizedRemoteSelection);
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
          }

          return;
        }

        remoteHydrated.current = true;

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
  }, [convex, identityArgs, upsertCourseSelection]);

  useEffect(() => {
    function syncLocalSelectionToConvex() {
      if (!identityArgs || !remoteHydrated.current || syncingRemoteToLocal.current) {
        return;
      }

      upsertCourseSelection(persistCourseSelectionArgs(identityArgs, loadCourseSelection())).catch((error) => {
        console.warn("Unable to sync course selection to Convex", error);
      });
    }

    window.addEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);

    return () => {
      window.removeEventListener(COURSE_SELECTION_CHANGE_EVENT, syncLocalSelectionToConvex);
    };
  }, [identityArgs, upsertCourseSelection]);

  return null;
}
