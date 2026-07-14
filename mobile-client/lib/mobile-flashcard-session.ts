export const MOBILE_FLASHCARD_SESSION_KEY = "intellectx:mobile-flashcard-session:v1";

type FlashcardSessionIdentity = {
  lessonId: string;
  blockType: string;
  front: string;
};

export function buildMobileFlashcardSessionCardKey(identity: FlashcardSessionIdentity) {
  return JSON.stringify([identity.lessonId, identity.blockType, identity.front]);
}

export function readMobileFlashcardSession(storage: Pick<Storage, "getItem">) {
  try {
    const value = storage.getItem(MOBILE_FLASHCARD_SESSION_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function writeMobileFlashcardSession(storage: Pick<Storage, "setItem">, cardKey: string) {
  try {
    storage.setItem(MOBILE_FLASHCARD_SESSION_KEY, cardKey);
    return true;
  } catch {
    return false;
  }
}
