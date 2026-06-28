"use client";

export const LEARNER_SESSION_KEY = "intellectx:learner-session";
const LEGACY_LEARNER_SESSION_KEY = "intellectx-demo-session";
const LEARNER_SESSION_CHANGE_EVENT = "intellectx:learner-session-change";

export type LearnerSession = {
  name: string;
  email: string;
  role: "student";
};

function normalizeLearnerSession(session: Partial<LearnerSession>): LearnerSession | null {
  if (!session.email) {
    return null;
  }

  return {
    name: session.name || session.email.split("@")[0] || "Learner",
    email: session.email,
    role: "student",
  };
}

function migrateLegacyLearnerSession(storedSession: string | null) {
  if (!storedSession) {
    return null;
  }

  window.localStorage.setItem(LEARNER_SESSION_KEY, storedSession);
  window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
  return storedSession;
}

export function createLearnerSession(session: LearnerSession) {
  window.localStorage.setItem(LEARNER_SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
  window.dispatchEvent(new Event(LEARNER_SESSION_CHANGE_EVENT));
}

export function getLearnerSession(): LearnerSession | null {
  const storedSession = window.localStorage.getItem(LEARNER_SESSION_KEY);

  if (storedSession) {
    window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
  }

  const legacySession = storedSession ? null : migrateLegacyLearnerSession(window.localStorage.getItem(LEGACY_LEARNER_SESSION_KEY));
  const sessionToParse = storedSession || legacySession;

  if (!sessionToParse) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(sessionToParse) as Partial<LearnerSession>;
    const normalizedSession = normalizeLearnerSession(parsedSession);

    if (!normalizedSession) {
      window.localStorage.removeItem(LEARNER_SESSION_KEY);
      window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
      return null;
    }

    return normalizedSession;
  } catch {
    window.localStorage.removeItem(LEARNER_SESSION_KEY);
    window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
    return null;
  }
}

export function clearLearnerSession() {
  window.localStorage.removeItem(LEARNER_SESSION_KEY);
  window.localStorage.removeItem(LEGACY_LEARNER_SESSION_KEY);
  window.dispatchEvent(new Event(LEARNER_SESSION_CHANGE_EVENT));
}
