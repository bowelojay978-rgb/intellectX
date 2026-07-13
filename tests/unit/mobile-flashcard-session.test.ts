import { describe, expect, it } from "vitest";
import {
  MOBILE_FLASHCARD_SESSION_KEY,
  buildMobileFlashcardSessionCardKey,
  readMobileFlashcardSession,
  writeMobileFlashcardSession,
} from "../../mobile-client/lib/mobile-flashcard-session";

describe("mobile flashcard session persistence", () => {
  it("builds a stable card identity from lesson, block type, and front content", () => {
    const first = buildMobileFlashcardSessionCardKey({
      lessonId: "lesson-1",
      blockType: "tapReveal",
      front: "What is recall?",
    });
    const second = buildMobileFlashcardSessionCardKey({
      lessonId: "lesson-1",
      blockType: "tapReveal",
      front: "What is recall?",
    });

    expect(first).toBe(second);
    expect(first).not.toBe(
      buildMobileFlashcardSessionCardKey({
        lessonId: "lesson-2",
        blockType: "tapReveal",
        front: "What is recall?",
      }),
    );
  });

  it("writes and reads the current flashcard key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(writeMobileFlashcardSession(storage, "card-key")).toBe(true);
    expect(values.get(MOBILE_FLASHCARD_SESSION_KEY)).toBe("card-key");
    expect(readMobileFlashcardSession(storage)).toBe("card-key");
  });

  it("fails safely when storage access is unavailable", () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readMobileFlashcardSession(blockedStorage)).toBeNull();
    expect(writeMobileFlashcardSession(blockedStorage, "card-key")).toBe(false);
  });

  it("treats missing or whitespace-only session values as absent", () => {
    expect(readMobileFlashcardSession({ getItem: () => null })).toBeNull();
    expect(readMobileFlashcardSession({ getItem: () => "   " })).toBeNull();
  });
});
