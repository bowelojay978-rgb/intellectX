"use client";

import { lessons } from "@/data/lessons";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs, type ConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import { mergeLessonProgressHistory, type LessonProgressHistoryItem } from "@/lib/lesson-progress-history";
import { useConvex } from "convex/react";
import { useEffect, useState } from "react";

type RemoteLessonProgress = {
  lessonId?: unknown;
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

  const lessonExists = lessons.some((lesson) => lesson.id === progress.lessonId);

  if (!lessonExists) {
    return null;
  }

  return {
    lessonId: progress.lessonId,
    status: progress.status,
    progress: progress.progress,
    updatedAt: new Date(progress.updatedAt).toISOString(),
  };
}

export function LessonProgressHistorySync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexLessonProgressHistorySync />;
}

function ConvexLessonProgressHistorySync() {
  const convex = useConvex();
  const [identityArgs, setIdentityArgs] = useState<ConvexLearnerArgs | null>(null);

  useEffect(() => {
    setIdentityArgs(getCurrentConvexLearnerArgs());

    function syncIdentity() {
      setIdentityArgs(getCurrentConvexLearnerArgs());
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
  }, [convex, identityArgs]);

  return null;
}
