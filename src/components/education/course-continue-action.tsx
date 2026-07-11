"use client";

import { Button } from "@/components/ui/button";
import { getCourseContinueTarget } from "@/lib/course-progress";
import {
  LESSON_PROGRESS_HISTORY_CHANGE_EVENT,
  readLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CourseContinueActionProps = {
  lessons: { id: string }[];
};

export function CourseContinueAction({ lessons }: CourseContinueActionProps) {
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

  const target = useMemo(() => getCourseContinueTarget(lessons, history), [history, lessons]);

  if (!target) {
    return (
      <Button className="mt-8" size="lg" disabled>
        Lessons coming soon
      </Button>
    );
  }

  return (
    <Button className="mt-8" size="lg" asChild>
      <Link href={`/learn/${target.lessonId}`}>
        {target.label}
        <ArrowRightIcon />
      </Link>
    </Button>
  );
}
