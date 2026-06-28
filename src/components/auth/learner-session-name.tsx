"use client";

import { getLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { useEffect, useState } from "react";

type LearnerSessionNameProps = {
  fallback?: string;
  firstNameOnly?: boolean;
};

function formatLearnerName(session: LearnerSession | null, fallback: string, firstNameOnly: boolean) {
  const displayName = session?.name?.trim() || fallback;

  if (!firstNameOnly) {
    return displayName;
  }

  return displayName.split(/\s+/)[0] || fallback;
}

export function LearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  const [session, setSession] = useState<LearnerSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("intellectx:learner-session-change", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("intellectx:learner-session-change", syncSession);
    };
  }, []);

  return <>{formatLearnerName(session, fallback, firstNameOnly)}</>;
}
