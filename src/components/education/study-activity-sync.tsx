"use client";

import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
} from "@/lib/lesson-progress-history";
import {
  QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT,
} from "@/lib/quiz-attempt-history";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { hasPendingLocalLearnerMigrationSource } from "@/lib/authenticated-learner-local-data";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import { readStudyActivitySummary } from "@/lib/study-activity-summary";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef } from "react";

export function StudyActivitySync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexStudyActivitySync />;
}

function ConvexStudyActivitySync() {
  const updateStudyStats = useMutation(convexApi.studyStats.updateStudyStats);
  const lastSyncedPayload = useRef<string | null>(null);
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  const syncStudyStats = useCallback(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);

    if (isAuthenticated && hasPendingLocalLearnerMigrationSource()) {
      return;
    }

    const identityArgs = getCurrentConvexLearnerArgs(isAuthenticated);

    if (!identityArgs) {
      return;
    }

    const summary = readStudyActivitySummary();

    if (summary.activeDateCount === 0 || !summary.lastStudiedAt) {
      return;
    }

    const payload = {
      ...identityArgs,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      weeklyActiveDays: summary.weeklyActiveDayLabels,
      lastStudiedDate: summary.lastStudiedAt,
    };

    const payloadKey = JSON.stringify(payload);

    if (lastSyncedPayload.current === payloadKey) {
      return;
    }

    lastSyncedPayload.current = payloadKey;

    updateStudyStats(payload).catch((error) => {
      lastSyncedPayload.current = null;
      console.warn("Unable to sync study activity to Convex", error);
    });
  }, [isLoaded, isSignedIn, updateStudyStats, userId]);

  useEffect(() => {
    lastSyncedPayload.current = null;
  }, [userId]);

  useEffect(() => {
    syncStudyStats();

    window.addEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncStudyStats);
    window.addEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncStudyStats);
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncStudyStats);
    window.addEventListener("storage", syncStudyStats);
    window.addEventListener("focus", syncStudyStats);
    window.addEventListener("pageshow", syncStudyStats);

    return () => {
      window.removeEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncStudyStats);
      window.removeEventListener(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT, syncStudyStats);
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncStudyStats);
      window.removeEventListener("storage", syncStudyStats);
      window.removeEventListener("focus", syncStudyStats);
      window.removeEventListener("pageshow", syncStudyStats);
    };
  }, [syncStudyStats]);

  return null;
}
