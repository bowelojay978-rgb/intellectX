"use client";

import { quizzes } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import {
  getCurrentConvexLearnerIdentity,
  type ConvexLearnerArgs,
  type ConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { hasPendingLocalLearnerMigrationSource } from "@/lib/authenticated-learner-local-data";
import { hydrateAuthenticatedQuizAttemptHistory } from "@/lib/authenticated-learner-hydration";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import {
  mergeQuizAttemptHistory,
  type QuizAttemptHistoryItem,
} from "@/lib/quiz-attempt-history";
import { useConvex } from "convex/react";
import { useEffect, useState } from "react";

type RemoteQuizAttempt = {
  quizId?: unknown;
  quizTitle?: unknown;
  score?: unknown;
  totalQuestions?: unknown;
  percentage?: unknown;
  completedAt?: unknown;
};

function toQuizAttemptHistoryItem(value: unknown): QuizAttemptHistoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const attempt = value as RemoteQuizAttempt;

  if (
    typeof attempt.quizId !== "string" ||
    typeof attempt.score !== "number" ||
    typeof attempt.totalQuestions !== "number" ||
    typeof attempt.completedAt !== "number"
  ) {
    return null;
  }

  const quiz = quizzes.find((item) => item.id === attempt.quizId);
  const quizTitle = typeof attempt.quizTitle === "string" ? attempt.quizTitle : (quiz?.title ?? attempt.quizId);
  const percentage =
    typeof attempt.percentage === "number"
      ? attempt.percentage
      : Math.round((attempt.score / attempt.totalQuestions) * 100);

  return {
    quizId: attempt.quizId,
    quizTitle,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage,
    completedAt: new Date(attempt.completedAt).toISOString(),
  };
}

function getIdentityArgs(identity: ConvexLearnerIdentity): ConvexLearnerArgs {
  return identity.userKey ? { userKey: identity.userKey } : {};
}

export function QuizAttemptHistorySync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexQuizAttemptHistorySync />;
}

function ConvexQuizAttemptHistorySync() {
  const convex = useConvex();
  const [identity, setIdentity] = useState<ConvexLearnerIdentity | null>(null);
  const { isLoaded, isSignedIn, userId, primaryEmailAddress } = useLearnerAuthRuntime();

  useEffect(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));

    function syncIdentity() {
      const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
      setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));
    }

    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    let cancelled = false;
    const identityArgs = getIdentityArgs(identity);

    convex
      .query(convexApi.quizzes.getQuizAttempts, identityArgs)
      .then((remoteAttempts) => {
        if (cancelled || !Array.isArray(remoteAttempts)) {
          return;
        }

        const attempts = remoteAttempts
          .map((attempt) => toQuizAttemptHistoryItem(attempt))
          .filter((attempt): attempt is QuizAttemptHistoryItem => Boolean(attempt));

        if (identity.source === "authenticated-convex") {
          hydrateAuthenticatedQuizAttemptHistory(
            attempts,
            hasPendingLocalLearnerMigrationSource({ authenticatedEmail: primaryEmailAddress }),
          );
          return;
        }

        if (attempts.length > 0) {
          mergeQuizAttemptHistory(attempts);
        }
      })
      .catch((error) => {
        if (cancelled) return;

        console.warn("Unable to hydrate quiz attempt history from Convex", error);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, identity, primaryEmailAddress]);

  return null;
}
