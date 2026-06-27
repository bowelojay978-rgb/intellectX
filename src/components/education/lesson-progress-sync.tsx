"use client";

import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useMutation } from "convex/react";
import { useEffect } from "react";

type LessonProgressSyncProps = {
  lessonId: string;
};

export function LessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexLessonProgressSync lessonId={lessonId} />;
}

function ConvexLessonProgressSync({ lessonId }: LessonProgressSyncProps) {
  const updateProgress = useMutation(convexApi.lessons.updateLessonProgress);

  useEffect(() => {
    updateProgress({
      userKey: "demo-user",
      lessonId,
      status: "in_progress",
      progress: 25,
    }).catch((error) => {
      console.warn("Unable to sync lesson progress to Convex", error);
    });
  }, [lessonId, updateProgress]);

  return null;
}
