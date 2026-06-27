"use client";

export const DEMO_SESSION_KEY = "intellectx-demo-session";

export type DemoSession = {
  name: string;
  email: string;
  role: "student";
};

export function createDemoSession(session: DemoSession) {
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("intellectx-demo-session-change"));
}

export function getDemoSession(): DemoSession | null {
  const storedSession = window.localStorage.getItem(DEMO_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as Partial<DemoSession>;

    if (!parsedSession.email) {
      return null;
    }

    return {
      name: parsedSession.name || parsedSession.email.split("@")[0] || "Demo learner",
      email: parsedSession.email,
      role: "student",
    };
  } catch {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

export function clearDemoSession() {
  window.localStorage.removeItem(DEMO_SESSION_KEY);
  window.dispatchEvent(new Event("intellectx-demo-session-change"));
}
