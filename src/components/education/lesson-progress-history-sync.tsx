"use client";
import { convexApi } from "@/lib/convex-api";
import {
  getCurrentConvexLearnerIdentity,
  type ConvexLearnerArgs,
  type ConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { hasPendingLocalLearnerMigrationSource } from "@/lib/authenticated-learner-local-data";
import { hydrateAuthenticatedLessonProgressHistory } from "@/lib/authenticated-learner-hydration";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import {
  mergeLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import { useConvex } from "convex/react";
import { useEffect, useState } from "react";

type RemoteLessonProgress = {
  lessonId?: unknown;
  lessonTitle?: unknown;
  status?: unknown;
  progress?: unknown;
  updatedAt?: unknown;
};

function toLessonProgressHistoryItem(value: unknown): LessonProgressHistoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const progress = value as RemoteLessonProgress;

  if (
    typeof progress.lessonId !== "string" ||
    typeof progress.status !== "string" ||
    typeof progress.progress !== "number" ||
    typeof progress.updatedAt !== "number"
  ) {
    return null;
  }

  return {
    lessonId: progress.lessonId,
    lessonTitle: typeof progress.lessonTitle === "string" ? progress.lessonTitle : undefined,
    status: progress.status,
    progress: progress.progress,
    updatedAt: new Date(progress.updatedAt).toISOString(),
  };
}

function getIdentityArgs(identity: ConvexLearnerIdentity): ConvexLearnerArgs {
  return identity.userKey ? { userKey: identity.userKey } : {};
}

export function LessonProgressHistorySync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexLessonProgressHistorySync />;
}

function ConvexLessonProgressHistorySync() {
  const convex = useConvex();
  const [identity, setIdentity] = useState<ConvexLearnerIdentity | null>(null);
  const { isLoaded, isSignedIn, userId, primaryEmailAddress } = useLearnerAuthRuntime();

  useEffect(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));

    function syncIdentity() {
      const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
      setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));
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

    let cancelled = false;
    const identityArgs = getIdentityArgs(identity);
    const remoteRequestedAt = Date.now();

    convex
      .query(convexApi.progress.getProgressSummary, identityArgs)
      .then((summary) => {
        if (cancelled || !summary || typeof summary !== "object") {
          return;
        }

        const lessonProgress = (summary as { lessonProgress?: unknown }).lessonProgress;

        if (!Array.isArray(lessonProgress)) {
          return;
        }

        const items = lessonProgress
          .map((item) => toLessonProgressHistoryItem(item))
          .filter((item): item is LessonProgressHistoryItem => Boolean(item));

        if (identity.source === "authenticated-convex") {
          hydrateAuthenticatedLessonProgressHistory(
            items,
            hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress }),
            remoteRequestedAt,
          );
          return;
        }

        if (items.length > 0) {
          mergeLessonProgressHistory(items);
        }
      })
      .catch((error) => {
        if (cancelled) return;

        console.warn("Unable to hydrate lesson progress from Convex", error);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, identity, primaryEmailAddress]);

  return null;
}
