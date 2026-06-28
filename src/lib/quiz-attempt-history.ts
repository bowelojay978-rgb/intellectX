export type QuizAttemptHistoryItem = {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
};

const quizAttemptHistoryKey = "intellectx:quiz-attempt-history";
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

export function readQuizAttemptHistory(storage: Storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(quizAttemptHistoryKey) ?? "[]") as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isQuizAttemptHistoryItem).sort((left, right) => {
      return new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime();
    });
  } catch {
    return [];
  }
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

  storage.setItem(quizAttemptHistoryKey, JSON.stringify(history));
  return attempt;
}

