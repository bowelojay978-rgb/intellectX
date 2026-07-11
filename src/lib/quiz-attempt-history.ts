export type QuizAttemptHistoryItem = {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
};

export const QUIZ_ATTEMPT_HISTORY_KEY = "intellectx:quiz-attempt-history";
export const QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT = "intellectx-quiz-attempt-history-change";

const maxStoredAttempts = 20;

function isQuizAttemptHistoryItem(value: unknown): value is QuizAttemptHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<QuizAttemptHistoryItem>;
  return (
    typeof item.quizId === "string" &&
    typeof item.quizTitle === "string" &&
    typeof item.score === "number" &&
    typeof item.totalQuestions === "number" &&
    typeof item.percentage === "number" &&
    typeof item.completedAt === "string"
  );
}

function sortQuizAttemptHistory(attempts: QuizAttemptHistoryItem[]) {
  return [...attempts].sort((left, right) => {
    return new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime();
  });
}

function attemptsLikelyMatch(left: QuizAttemptHistoryItem, right: QuizAttemptHistoryItem) {
  const leftTime = new Date(left.completedAt).getTime();
  const rightTime = new Date(right.completedAt).getTime();

  return (
    left.quizId === right.quizId &&
    left.score === right.score &&
    left.totalQuestions === right.totalQuestions &&
    Math.abs(leftTime - rightTime) < 10_000
  );
}

export function readQuizAttemptHistory(storage: Storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(QUIZ_ATTEMPT_HISTORY_KEY) ?? "[]") as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortQuizAttemptHistory(parsed.filter(isQuizAttemptHistoryItem));
  } catch {
    return [];
  }
}

export function writeQuizAttemptHistory(attempts: QuizAttemptHistoryItem[], storage: Storage = window.localStorage) {
  const history = sortQuizAttemptHistory(attempts.filter(isQuizAttemptHistoryItem)).slice(0, maxStoredAttempts);

  storage.setItem(QUIZ_ATTEMPT_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT));

  return history;
}

export function clearQuizAttemptHistory(storage: Storage = window.localStorage) {
  storage.removeItem(QUIZ_ATTEMPT_HISTORY_KEY);
  window.dispatchEvent(new Event(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT));
}

export function mergeQuizAttemptHistory(attempts: QuizAttemptHistoryItem[], storage: Storage = window.localStorage) {
  const existing = readQuizAttemptHistory(storage);
  const merged = [...existing];

  for (const attempt of attempts) {
    if (!isQuizAttemptHistoryItem(attempt)) {
      continue;
    }

    if (!merged.some((existingAttempt) => attemptsLikelyMatch(existingAttempt, attempt))) {
      merged.push(attempt);
    }
  }

  return writeQuizAttemptHistory(merged, storage);
}

export type QuizAttemptHistorySummary = {
  attemptCount: number;
  averagePercentage: number;
  latestByQuizId: Record<string, QuizAttemptHistoryItem>;
};

export function summarizeQuizAttemptHistory(attempts: QuizAttemptHistoryItem[]): QuizAttemptHistorySummary {
  const sortedAttempts = sortQuizAttemptHistory(attempts);
  const latestByQuizId: Record<string, QuizAttemptHistoryItem> = {};

  for (const attempt of sortedAttempts) {
    if (!latestByQuizId[attempt.quizId]) {
      latestByQuizId[attempt.quizId] = attempt;
    }
  }

  const averagePercentage =
    sortedAttempts.length > 0
      ? Math.round(sortedAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / sortedAttempts.length)
      : 0;

  return {
    attemptCount: sortedAttempts.length,
    averagePercentage,
    latestByQuizId,
  };
}

export function saveQuizAttemptHistoryItem(
  item: Omit<QuizAttemptHistoryItem, "percentage" | "completedAt">,
  storage: Storage = window.localStorage,
) {
  const attempt: QuizAttemptHistoryItem = {
    ...item,
    percentage: Math.round((item.score / item.totalQuestions) * 100),
    completedAt: new Date().toISOString(),
  };
  const history = [attempt, ...readQuizAttemptHistory(storage)].slice(0, maxStoredAttempts);

  storage.setItem(QUIZ_ATTEMPT_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event(QUIZ_ATTEMPT_HISTORY_CHANGE_EVENT));

  return attempt;
}
