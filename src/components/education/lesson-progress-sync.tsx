"use client";

import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { readLessonProgressHistory, recordLessonProgress } from "@/lib/lesson-progress-history";
import { useMutation } from "convex/react";
import { useEffect } from "react";

type LessonProgressSyncProps = {
  lessonId: string;
};

function recordLessonOpened(lessonId: string) {
  const existing = readLessonProgressHistory().find((item) => item.lessonId === lessonId);

  if (existing && (existing.progress >= 100 || existing.status === "completed")) {
    return recordLessonProgress({
      lessonId,
      status: "completed",
      progress: 100,
    });
  }

  return recordLessonProgress({
    lessonId,
    status: existing?.status ?? "in_progress",
    progress: Math.max(existing?.progress ?? 0, 25),
  });
}

export function LessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  if (!convexEnv.isConfigured) {
    return <LocalLessonProgressSync lessonId={lessonId} />;
  }

  return <ConvexLessonProgressSync lessonId={lessonId} />;
}

function LocalLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  useEffect(() => {
    recordLessonOpened(lessonId);
  }, [lessonId]);

  return null;
}

function ConvexLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  const updateProgress = useMutation(convexApi.lessons.updateLessonProgress);

  useEffect(() => {
    const localProgress = recordLessonOpened(lessonId);
    const identityArgs = getCurrentConvexLearnerArgs();

    if (!identityArgs) {
      return;
    }

    updateProgress({
      ...identityArgs,
      lessonId,
      status: localProgress.status,
      progress: localProgress.progress,
    }).catch((error) => {
      console.warn("Unable to sync lesson progress to Convex", error);
    });
  }, [lessonId, updateProgress]);

  return null;
}
