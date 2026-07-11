"use client";

import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { recordLessonOpened } from "@/lib/lesson-progress";
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
    recordLessonOpened(lessonId);
  }, [lessonId]);

  return null;
}

function ConvexLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  const updateProgress = useMutation(convexApi.lessons.updateLessonProgress);
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  useEffect(() => {
    const localProgress = recordLessonOpened(lessonId);
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    const identityArgs = getCurrentConvexLearnerArgs(isAuthenticated);

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
  }, [isLoaded, isSignedIn, lessonId, updateProgress, userId]);

  return null;
}
