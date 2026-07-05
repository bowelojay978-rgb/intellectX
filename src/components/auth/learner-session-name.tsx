"use client";

import { useUser } from "@clerk/nextjs";
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
  const displayName = session?.name?.trim() || fallback;

  if (!firstNameOnly) {
    return displayName;
  }

  return displayName.split(/\s+/)[0] || fallback;
}

export function LearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkLearnerSessionName fallback={fallback} firstNameOnly={firstNameOnly} />;
  }

  return <LocalLearnerSessionName fallback={fallback} firstNameOnly={firstNameOnly} />;
}

function getClerkName(user: ReturnType<typeof useUser>["user"], fallback: string) {
  return user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || fallback;
}

function ClerkLearnerSessionName({ fallback = "Learner", firstNameOnly = false }: LearnerSessionNameProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const displayName = isLoaded && isSignedIn ? getClerkName(user, fallback) : fallback;

  if (!firstNameOnly) {
    return <>{displayName}</>;
  }

  return <>{displayName.split(/\s+/)[0] || fallback}</>;
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
