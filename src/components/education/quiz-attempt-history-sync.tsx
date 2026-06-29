"use client";

import { quizzes } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { getCurrentLearnerIdentity } from "@/lib/learner-session";
import { mergeQuizAttemptHistory, type QuizAttemptHistoryItem } from "@/lib/quiz-attempt-history";
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

export function QuizAttemptHistorySync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexQuizAttemptHistorySync />;
}

function ConvexQuizAttemptHistorySync() {
  const convex = useConvex();
  const [userKey, setUserKey] = useState<string | null>(null);

  useEffect(() => {
    setUserKey(getCurrentLearnerIdentity()?.userKey ?? null);

    function syncIdentity() {
      setUserKey(getCurrentLearnerIdentity()?.userKey ?? null);
    }

    window.addEventListener("intellectx:learner-session-change", syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener("intellectx:learner-session-change", syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, []);

  useEffect(() => {
    if (!userKey) {
      return;
    }

    let cancelled = false;

    convex
      .query(convexApi.quizzes.getQuizAttempts, { userKey })
      .then((remoteAttempts) => {
        if (cancelled || !Array.isArray(remoteAttempts)) {
          return;
        }

        const attempts = remoteAttempts
          .map((attempt) => toQuizAttemptHistoryItem(attempt))
          .filter((attempt): attempt is QuizAttemptHistoryItem => Boolean(attempt));

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
  }, [convex, userKey]);

  return null;
}
