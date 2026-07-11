"use client";

import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { Button } from "@/components/ui/button";
import { convexApi } from "@/lib/convex-api";
import { getCurrentConvexLearnerArgs } from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  recordLessonProgress,
} from "@/lib/lesson-progress-history";
import { CheckCircle2Icon } from "lucide-react";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";

type LessonCompletionActionProps = {
  lessonId: string;
};

function useLessonCompleted(lessonId: string) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    function syncCompletion() {
      const progress = readLessonProgressHistory().find((item) => item.lessonId === lessonId);
      setCompleted(Boolean(progress && (progress.progress >= 100 || progress.status === "completed")));
    }

    syncCompletion();
    window.addEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncCompletion);
    window.addEventListener("storage", syncCompletion);
    window.addEventListener("pageshow", syncCompletion);

    return () => {
      window.removeEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncCompletion);
      window.removeEventListener("storage", syncCompletion);
      window.removeEventListener("pageshow", syncCompletion);
    };
  }, [lessonId]);

  return completed;
}

function completeLessonLocally(lessonId: string) {
  return recordLessonProgress({
    lessonId,
    status: "completed",
    progress: 100,
  });
}

export function LessonCompletionAction({ lessonId }: LessonCompletionActionProps) {
  if (!convexEnv.isConfigured) {
    return <LocalLessonCompletionAction lessonId={lessonId} />;
  }

  return <ConvexLessonCompletionAction lessonId={lessonId} />;
}

function LocalLessonCompletionAction({ lessonId }: LessonCompletionActionProps) {
  const completed = useLessonCompleted(lessonId);

  return (
    <Button type="button" size="lg" disabled={completed} onClick={() => completeLessonLocally(lessonId)}>
      <CheckCircle2Icon />
      {completed ? "Lesson completed" : "Mark lesson complete"}
    </Button>
  );
}

function ConvexLessonCompletionAction({ lessonId }: LessonCompletionActionProps) {
  const completed = useLessonCompleted(lessonId);
  const updateProgress = useMutation(convexApi.lessons.updateLessonProgress);
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  function handleComplete() {
    if (completed) return;

    const progress = completeLessonLocally(lessonId);
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    const identityArgs = getCurrentConvexLearnerArgs(isAuthenticated);

    if (!identityArgs) {
      return;
    }

    updateProgress({
      ...identityArgs,
      lessonId,
      status: progress.status,
      progress: progress.progress,
    }).catch((error) => {
      console.warn("Unable to sync completed lesson progress to Convex", error);
    });
  }

  return (
    <Button type="button" size="lg" disabled={completed} onClick={handleComplete}>
      <CheckCircle2Icon />
      {completed ? "Lesson completed" : "Mark lesson complete"}
    </Button>
  );
}
