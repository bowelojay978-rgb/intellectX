export type LessonProgressHistoryItem = {
  lessonId: string;
  status: string;
  progress: number;
  updatedAt: string;
};

export type LessonProgressHistorySummary = {
  lessonCount: number;
  inProgressCount: number;
  completedCount: number;
  latestLessons: LessonProgressHistoryItem[];
};

export const LESSON_PROGRESS_HISTORY_KEY = "intellectx:lesson-progress-history";
export const LESSON_PROGRESS_HISTORY_CHANGE_EVENT = "intellectx-lesson-progress-history-change";

const maxStoredLessonProgressItems = 50;

function isLessonProgressHistoryItem(value: unknown): value is LessonProgressHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<LessonProgressHistoryItem>;

  return (
    typeof item.lessonId === "string" &&
    typeof item.status === "string" &&
    typeof item.progress === "number" &&
    typeof item.updatedAt === "string"
  );
}

function sortLessonProgressHistory(items: LessonProgressHistoryItem[]) {
  return [...items].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function compactLatestByLesson(items: LessonProgressHistoryItem[]) {
  const latestByLessonId = new Map<string, LessonProgressHistoryItem>();

  for (const item of sortLessonProgressHistory(items)) {
    if (!latestByLessonId.has(item.lessonId)) {
      latestByLessonId.set(item.lessonId, {
        ...item,
        progress: Math.min(Math.max(item.progress, 0), 100),
      });
    }
  }

  return sortLessonProgressHistory([...latestByLessonId.values()]).slice(0, maxStoredLessonProgressItems);
}

export function readLessonProgressHistory(storage: Storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(LESSON_PROGRESS_HISTORY_KEY) ?? "[]") as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return compactLatestByLesson(parsed.filter(isLessonProgressHistoryItem));
  } catch {
    return [];
  }
}

export function writeLessonProgressHistory(
  items: LessonProgressHistoryItem[],
  storage: Storage = window.localStorage,
) {
  const history = compactLatestByLesson(items);

  storage.setItem(LESSON_PROGRESS_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event(LESSON_PROGRESS_HISTORY_CHANGE_EVENT));

  return history;
}

export function mergeLessonProgressHistory(
  items: LessonProgressHistoryItem[],
  storage: Storage = window.localStorage,
) {
  return writeLessonProgressHistory([...readLessonProgressHistory(storage), ...items], storage);
}

export function recordLessonProgress(
  item: Omit<LessonProgressHistoryItem, "updatedAt"> & { updatedAt?: string },
  storage: Storage = window.localStorage,
) {
  const progressItem: LessonProgressHistoryItem = {
    ...item,
    progress: Math.min(Math.max(item.progress, 0), 100),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };

  return writeLessonProgressHistory([progressItem, ...readLessonProgressHistory(storage)], storage)[0];
}

export function summarizeLessonProgressHistory(
  items: LessonProgressHistoryItem[],
): LessonProgressHistorySummary {
  const latestLessons = compactLatestByLesson(items);
  const completedCount = latestLessons.filter((item) => item.progress >= 100 || item.status === "completed").length;

  return {
    lessonCount: latestLessons.length,
    inProgressCount: latestLessons.filter((item) => item.progress > 0 && item.progress < 100).length,
    completedCount,
    latestLessons: latestLessons.slice(0, 3),
  };
}
