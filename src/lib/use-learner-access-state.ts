"use client";

import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { getLearnerSession, LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import { useEffect, useState } from "react";

export function useLearnerAccessState() {
  const authRuntime = useLearnerAuthRuntime();
  const [hasLocalSession, setHasLocalSession] = useState(false);

  useEffect(() => {
    if (authRuntime.mode !== "local") return;

    function syncLocalSession() {
      setHasLocalSession(Boolean(getLearnerSession()));
    }

    syncLocalSession();
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncLocalSession);
    window.addEventListener("storage", syncLocalSession);
    window.addEventListener("pageshow", syncLocalSession);

    return () => {
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncLocalSession);
      window.removeEventListener("storage", syncLocalSession);
      window.removeEventListener("pageshow", syncLocalSession);
    };
  }, [authRuntime.mode]);

  if (authRuntime.mode === "clerk") {
    return {
      isLoaded: authRuntime.isLoaded,
      isSignedIn: authRuntime.isLoaded && authRuntime.isSignedIn,
    };
  }

  return { isLoaded: true, isSignedIn: hasLocalSession };
}
