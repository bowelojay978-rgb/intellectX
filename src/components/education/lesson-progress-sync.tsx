"use client";

import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerIdentity } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { recordLessonProgress } from "@/lib/lesson-progress-history";
import { useMutation } from "convex/react";
import { useEffect } from "react";

type LessonProgressSyncProps = {
  lessonId: string;
};

export function LessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  if (!convexEnv.isConfigured) {
    return <LocalLessonProgressSync lessonId={lessonId} />;
  }

  return <ConvexLessonProgressSync lessonId={lessonId} />;
}

function LocalLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  useEffect(() => {
    recordLessonProgress({
      lessonId,
      status: "in_progress",
      progress: 25,
    });
  }, [lessonId]);

  return null;
}

function ConvexLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  const updateProgress = useMutation(convexApi.lessons.updateLessonProgress);

  useEffect(() => {
    const localProgress = recordLessonProgress({
      lessonId,
      status: "in_progress",
      progress: 25,
    });
    const identity = getCurrentConvexLearnerIdentity();

    if (!identity) {
      return;
    }

    updateProgress({
      userKey: identity.userKey,
      lessonId,
      status: localProgress.status,
      progress: localProgress.progress,
    }).catch((error) => {
      console.warn("Unable to sync lesson progress to Convex", error);
    });
  }, [lessonId, updateProgress]);

  return null;
}
