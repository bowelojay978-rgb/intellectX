"use client";

import { useUser } from "@clerk/nextjs";
import { getClerkDisplayName, getFirstDisplayNamePart, getLocalLearnerDisplayName } from "@/lib/auth-identity";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import {
  getLearnerSession,
  LEARNER_SESSION_CHANGE_EVENT,
  type LearnerSession,
} from "@/lib/learner-session";
import { useEffect, useState } from "react";

type LearnerSessionNameProps = {
  fallback?: string;
  firstNameOnly?: boolean;
};

function formatLearnerName(session: LearnerSession | null, fallback: string, firstNameOnly: boolean) {
  const displayName = getLocalLearnerDisplayName(session, fallback);

  if (!firstNameOnly) {
    return displayName;
  }

  return getFirstDisplayNamePart(displayName, fallback);
}

export function LearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  if (isClerkAuthEnabled()) {
    return <ClerkLearnerSessionName fallback={fallback} firstNameOnly={firstNameOnly} />;
  }

  return <LocalLearnerSessionName fallback={fallback} firstNameOnly={firstNameOnly} />;
}

function ClerkLearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const displayName = isLoaded && isSignedIn ? getClerkDisplayName(user, fallback) : fallback;

  if (!firstNameOnly) {
    return <>{displayName}</>;
  }

  return <>{getFirstDisplayNamePart(displayName, fallback)}</>;
}

function LocalLearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  const [session, setSession] = useState<LearnerSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  return <>{formatLearnerName(session, fallback, firstNameOnly)}</>;
}
