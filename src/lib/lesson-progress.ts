import {
  readLessonProgressHistory,
  recordLessonProgress,
} from "@/lib/lesson-progress-history";

export function recordLessonOpened(
  lessonId: string,
  storage: Storage = window.localStorage,
) {
  const existing = readLessonProgressHistory(storage).find(
    (item) => item.lessonId === lessonId,
  );

  if (existing && (existing.progress >= 100 || existing.status === "completed")) {
    return recordLessonProgress(
      {
        lessonId,
        status: "completed",
        progress: 100,
      },
      storage,
    );
  }

  return recordLessonProgress(
    {
      lessonId,
      status: existing?.status ?? "in_progress",
      progress: Math.max(existing?.progress ?? 0, 25),
    },
    storage,
  );
}

export function recordLessonCompleted(
  lessonId: string,
  storage: Storage = window.localStorage,
) {
  return recordLessonProgress(
    {
      lessonId,
      status: "completed",
      progress: 100,
    },
    storage,
  );
}
