import {
  readLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import {
  readQuizAttemptHistory,
  type QuizAttemptHistoryItem,
} from "@/lib/quiz-attempt-history";

export const studyWeekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type StudyWeekdayLabel = (typeof studyWeekdayLabels)[number];

export type StudyActivitySummary = {
  activeDateCount: number;
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastStudiedAt: string | null;
  lastStudiedLabel: string;
  weeklyActiveDayLabels: StudyWeekdayLabel[];
};

export const emptyStudyActivitySummary: StudyActivitySummary = {
  activeDateCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  isActiveToday: false,
  lastStudiedAt: null,
  lastStudiedLabel: "Not recorded yet",
  weeklyActiveDayLabels: [],
};

function toLocalDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toLocalDateKey(date) ?? dateKey;
}

function startOfWeekMonday(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + offset);

  return start;
}

function getWeekdayLabel(dateKey: string): StudyWeekdayLabel | null {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const mondayBasedIndex = day === 0 ? 6 : day - 1;

  return studyWeekdayLabels[mondayBasedIndex] ?? null;
}

function getCurrentStreak(activeDateKeys: string[], todayKey: string) {
  const activeDates = new Set(activeDateKeys);
  const yesterdayKey = addDays(todayKey, -1);
  const anchorDate = activeDates.has(todayKey) ? todayKey : activeDates.has(yesterdayKey) ? yesterdayKey : null;

  if (!anchorDate) {
    return 0;
  }

  let streak = 0;
  let cursor = anchorDate;

  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getLongestStreak(activeDateKeys: string[]) {
  const sortedKeys = [...activeDateKeys].sort();

  let longest = 0;
  let current = 0;
  let previousKey: string | null = null;

  for (const key of sortedKeys) {
    if (!previousKey || key === addDays(previousKey, 1)) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previousKey = key;
  }

  return longest;
}

function formatLastStudiedLabel(lastStudiedAt: string | null, now: Date) {
  if (!lastStudiedAt) {
    return "Not recorded yet";
  }

  const todayKey = toLocalDateKey(now);
  const lastKey = toLocalDateKey(lastStudiedAt);

  if (!todayKey || !lastKey) {
    return "Not recorded yet";
  }

  if (lastKey === todayKey) {
    return "Today";
  }

  if (lastKey === addDays(todayKey, -1)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(lastStudiedAt));
}

export function summarizeStudyActivity(
  lessonHistory: LessonProgressHistoryItem[],
  quizHistory: QuizAttemptHistoryItem[],
  now = new Date(),
): StudyActivitySummary {
  const activityTimes = [
    ...lessonHistory.map((item) => item.updatedAt),
    ...quizHistory.map((item) => item.completedAt),
  ].filter((value) => !Number.isNaN(new Date(value).getTime()));

  if (activityTimes.length === 0) {
    return emptyStudyActivitySummary;
  }

  const activeDateKeys = [...new Set(activityTimes.map((value) => toLocalDateKey(value)).filter(Boolean) as string[])]
    .sort()
    .reverse();

  const todayKey = toLocalDateKey(now);

  if (!todayKey) {
    return emptyStudyActivitySummary;
  }

  const weekStartKey = toLocalDateKey(startOfWeekMonday(now));
  const weekEndKey = weekStartKey ? addDays(weekStartKey, 6) : todayKey;

  const weeklyActiveDayLabels = activeDateKeys
    .filter((key) => weekStartKey && key >= weekStartKey && key <= weekEndKey)
    .map(getWeekdayLabel)
    .filter((label): label is StudyWeekdayLabel => Boolean(label));

  const lastStudiedAt = [...activityTimes].sort((left, right) => {
    return new Date(right).getTime() - new Date(left).getTime();
  })[0];

  return {
    activeDateCount: activeDateKeys.length,
    currentStreak: getCurrentStreak(activeDateKeys, todayKey),
    longestStreak: getLongestStreak(activeDateKeys),
    isActiveToday: activeDateKeys.includes(todayKey),
    lastStudiedAt,
    lastStudiedLabel: formatLastStudiedLabel(lastStudiedAt, now),
    weeklyActiveDayLabels: [...new Set(weeklyActiveDayLabels)],
  };
}

export function readStudyActivitySummary(storage: Storage = window.localStorage) {
  return summarizeStudyActivity(readLessonProgressHistory(storage), readQuizAttemptHistory(storage));
}

export function formatStudyStreakValue(summary: StudyActivitySummary) {
  if (summary.activeDateCount === 0) {
    return "No activity yet";
  }

  if (summary.currentStreak === 0) {
    return "Streak paused";
  }

  return `${summary.currentStreak}-day streak`;
}
