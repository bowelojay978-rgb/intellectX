export const QUIZ_SESSION_STORAGE_PREFIX = "intellectx:quiz-session:";

export type QuizSessionState = {
  quizId: string;
  currentIndex: number;
  selectedIndex: number | null;
  submitted: boolean;
  answers: number[];
  timeLeft: number;
  savedAt: number;
};

function getStorage(storage?: Storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function getStorageKey(quizId: string) {
  return `${QUIZ_SESSION_STORAGE_PREFIX}${quizId}`;
}

function isQuizSessionState(value: unknown): value is QuizSessionState {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<QuizSessionState>;

  return (
    typeof session.quizId === "string" &&
    typeof session.currentIndex === "number" &&
    Number.isInteger(session.currentIndex) &&
    session.currentIndex >= 0 &&
    (session.selectedIndex === null ||
      (typeof session.selectedIndex === "number" && Number.isInteger(session.selectedIndex) && session.selectedIndex >= 0)) &&
    typeof session.submitted === "boolean" &&
    Array.isArray(session.answers) &&
    session.answers.every((answer) => typeof answer === "number" && Number.isInteger(answer)) &&
    typeof session.timeLeft === "number" &&
    Number.isFinite(session.timeLeft) &&
    session.timeLeft >= 0 &&
    typeof session.savedAt === "number" &&
    Number.isFinite(session.savedAt)
  );
}

export function readQuizSessionState(quizId: string, storage?: Storage): QuizSessionState | null {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return null;

  try {
    const raw = targetStorage.getItem(getStorageKey(quizId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isQuizSessionState(parsed) || parsed.quizId !== quizId) {
      targetStorage.removeItem(getStorageKey(quizId));
      return null;
    }

    return parsed;
  } catch {
    targetStorage.removeItem(getStorageKey(quizId));
    return null;
  }
}

export function writeQuizSessionState(session: QuizSessionState, storage?: Storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return session;

  targetStorage.setItem(getStorageKey(session.quizId), JSON.stringify(session));
  return session;
}

export function clearQuizSessionState(quizId: string, storage?: Storage) {
  const targetStorage = getStorage(storage);
  targetStorage?.removeItem(getStorageKey(quizId));
}

export function getRestoredQuizTimeLeft(session: QuizSessionState, now = Date.now()) {
  const elapsedSeconds = Math.max(0, Math.floor((now - session.savedAt) / 1000));
  return Math.max(0, Math.floor(session.timeLeft) - elapsedSeconds);
}
