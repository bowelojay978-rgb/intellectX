"use client";

import { Button } from "@/components/ui/button";
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

type ContinueTarget = {
  lessonId: string;
  label: "Start learning" | "Continue learning" | "Review course";
};

function isCompleted(item: LessonProgressHistoryItem | undefined) {
  return Boolean(item && (item.progress >= 100 || item.status === "completed"));
}

function getContinueTarget(lessons: { id: string }[], history: LessonProgressHistoryItem[]): ContinueTarget | null {
  if (lessons.length === 0) return null;

  const progressByLessonId = new Map(history.map((item) => [item.lessonId, item]));
  const allCompleted = lessons.every((lesson) => isCompleted(progressByLessonId.get(lesson.id)));

  if (allCompleted) {
    return { lessonId: lessons[lessons.length - 1].id, label: "Review course" };
  }

  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const latestActivity = history.find((item) => lessonIds.has(item.lessonId));

  if (!latestActivity) {
    return { lessonId: lessons[0].id, label: "Start learning" };
  }

  if (!isCompleted(latestActivity)) {
    return { lessonId: latestActivity.lessonId, label: "Continue learning" };
  }

  const latestIndex = lessons.findIndex((lesson) => lesson.id === latestActivity.lessonId);
  const nextIncomplete = lessons
    .slice(Math.max(latestIndex + 1, 0))
    .find((lesson) => !isCompleted(progressByLessonId.get(lesson.id)));
  const firstIncomplete = lessons.find((lesson) => !isCompleted(progressByLessonId.get(lesson.id)));
  const target = nextIncomplete ?? firstIncomplete ?? lessons[0];

  return { lessonId: target.id, label: "Continue learning" };
}

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

  const target = useMemo(() => getContinueTarget(lessons, history), [history, lessons]);

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
