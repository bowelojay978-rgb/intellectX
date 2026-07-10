"use client";

import { ProgressBar } from "@/components/education/progress-bar";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import { useEffect, useMemo, useState } from "react";

type CourseProgressSummaryProps = {
  lessonIds: string[];
};

function calculateCourseProgress(lessonIds: string[], history: LessonProgressHistoryItem[]) {
  if (lessonIds.length === 0) return 0;

  const progressByLessonId = new Map(history.map((item) => [item.lessonId, item.progress]));
  const totalProgress = lessonIds.reduce((total, lessonId) => total + (progressByLessonId.get(lessonId) ?? 0), 0);

  return Math.round(totalProgress / lessonIds.length);
}

export function CourseProgressSummary({ lessonIds }: CourseProgressSummaryProps) {
  const [history, setHistory] = useState<LessonProgressHistoryItem[]>([]);

  useEffect(() => {
    function syncHistory() {
      setHistory(readLessonProgressHistory());
    }

    syncHistory();
    window.addEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncHistory);
    window.addEventListener("storage", syncHistory);
    window.addEventListener("pageshow", syncHistory);

    return () => {
      window.removeEventListener(LESSON_PROGRESS_HISTORY_CHANGE_EVENT, syncHistory);
      window.removeEventListener("storage", syncHistory);
      window.removeEventListener("pageshow", syncHistory);
    };
  }, []);

  const progress = useMemo(() => calculateCourseProgress(lessonIds, history), [history, lessonIds]);

  return (
    <div className="mt-6 max-w-md space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span>Course progress</span>
        <span>{progress}%</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}
