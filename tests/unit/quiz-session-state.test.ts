import { beforeEach, describe, expect, it } from "vitest";

import {
  QUIZ_SESSION_STORAGE_PREFIX,
  clearQuizSessionState,
  getRestoredQuizTimeLeft,
  readQuizSessionState,
  writeQuizSessionState,
} from "@/lib/quiz-session-state";

beforeEach(() => {
  sessionStorage.clear();
});

describe("quiz session state", () => {
  it("saves and restores an in-progress quiz attempt", () => {
    writeQuizSessionState({
      quizId: "quiz-a",
      currentIndex: 2,
      selectedIndex: 1,
      submitted: true,
      answers: [0, 2],
      timeLeft: 180,
      savedAt: 1_000,
    });

    expect(readQuizSessionState("quiz-a")).toEqual({
      quizId: "quiz-a",
      currentIndex: 2,
      selectedIndex: 1,
      submitted: true,
      answers: [0, 2],
      timeLeft: 180,
      savedAt: 1_000,
    });
  });

  it("subtracts elapsed real time when restoring the timer", () => {
    expect(
      getRestoredQuizTimeLeft(
        {
          quizId: "quiz-a",
          currentIndex: 0,
          selectedIndex: null,
          submitted: false,
          answers: [],
          timeLeft: 120,
          savedAt: 10_000,
        },
        40_000,
      ),
    ).toBe(90);
  });

  it("clears invalid stored quiz session data safely", () => {
    sessionStorage.setItem(`${QUIZ_SESSION_STORAGE_PREFIX}quiz-a`, JSON.stringify({ quizId: "quiz-a", currentIndex: -1 }));

    expect(readQuizSessionState("quiz-a")).toBeNull();
    expect(sessionStorage.getItem(`${QUIZ_SESSION_STORAGE_PREFIX}quiz-a`)).toBeNull();
  });

  it("removes a completed or restarted quiz session", () => {
    writeQuizSessionState({
      quizId: "quiz-a",
      currentIndex: 1,
      selectedIndex: null,
      submitted: false,
      answers: [1],
      timeLeft: 90,
      savedAt: 1_000,
    });

    clearQuizSessionState("quiz-a");

    expect(readQuizSessionState("quiz-a")).toBeNull();
  });
});
