"use client";

import { ProgressBar } from "@/components/education/progress-bar";
import { calculateCourseProgress } from "@/lib/course-progress";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import { useEffect, useMemo, useState } from "react";

type CourseProgressSummaryProps = {
  lessonIds: string[];
};

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
