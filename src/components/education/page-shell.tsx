"use client";

import { AcademicProfileSync } from "@/components/education/academic-profile-sync";
import { CourseSelectionSync } from "@/components/education/course-selection-sync";
import { LessonProgressHistorySync } from "@/components/education/lesson-progress-history-sync";
import { LocalLearnerDataMigrationSync } from "@/components/education/local-learner-data-migration-sync";
import { QuizAttemptHistorySync } from "@/components/education/quiz-attempt-history-sync";
import { StudyActivitySync } from "@/components/education/study-activity-sync";
import { Footer } from "@/components/footer/footer";
import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import {
  clearAuthenticatedLearnerLocalData,
  hasPendingLocalLearnerMigrationSource,
  readActiveClerkLearnerUserId,
  shouldClearAuthenticatedLearnerLocalDataForTransition,
  writeActiveClerkLearnerUserId,
} from "@/lib/authenticated-learner-local-data";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { getLearnerSession } from "@/lib/learner-session";
import { isAuthenticatedAppPath, isLearnerAppPath } from "@/lib/learner-routes";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PageShellProps = {
  children: React.ReactNode;
};

type PageShellFrameProps = PageShellProps & {
  canShowApp: boolean;
};

export function PageShell({ children }: PageShellProps) {
  if (isClerkAuthEnabled()) {
    return <ClerkPageShell>{children}</ClerkPageShell>;
  }

  return <LocalPageShell>{children}</LocalPageShell>;
}

function ClerkPageShell({ children }: PageShellProps) {
  const pathname = usePathname();
  const guarded = isLearnerAppPath(pathname);
  const authenticatedAppPath = isAuthenticatedAppPath(pathname);
  const { isLoaded, isSignedIn, userId, primaryEmailAddress } = useLearnerAuthRuntime();
  const [preparedUserId, setPreparedUserId] = useState<string | null>(null);
  const canShowApp =
    !authenticatedAppPath || Boolean(isLoaded && isSignedIn && userId && preparedUserId === userId);
  const authEnvironment = getAuthEnvironmentStatus();

  useEffect(() => {
    if (!isLoaded) {
      setPreparedUserId(null);
      return;
    }

    if (!isSignedIn || !userId) {
      // Route access and anonymous migration-source preservation are separate concerns.
      // Signed-out state must never destroy legitimate local learner data.
      setPreparedUserId(null);
      return;
    }

    const previousUserId = readActiveClerkLearnerUserId();
    const hasMigrationSource = hasPendingLocalLearnerMigrationSource({
      authenticatedEmail: primaryEmailAddress,
    });

    if (
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId,
        nextUserId: userId,
        hasMigrationSource,
      })
    ) {
      clearAuthenticatedLearnerLocalData();
    }

    writeActiveClerkLearnerUserId(userId);
    setPreparedUserId(userId);
  }, [isLoaded, isSignedIn, primaryEmailAddress, userId]);

  useEffect(() => {
    if (guarded && isLoaded && !isSignedIn) {
      window.location.replace("/login");
    }
  }, [guarded, isLoaded, isSignedIn, pathname]);

  return (
    <>
      {authEnvironment.canRunLocalToAuthMigration ? (
        <LocalLearnerDataMigrationSync
          isAuthLoaded={isLoaded}
          isSignedIn={isSignedIn}
          authenticatedUserId={userId}
          authenticatedEmail={primaryEmailAddress}
        />
      ) : null}
      <PageShellFrame canShowApp={canShowApp}>{children}</PageShellFrame>
    </>
  );
}

function LocalPageShell({ children }: PageShellProps) {
  const pathname = usePathname();
  const guarded = isLearnerAppPath(pathname);
  const [canShowApp, setCanShowApp] = useState(!guarded);

  useEffect(() => {
    function enforceAccess() {
      if (!guarded) {
        setCanShowApp(true);
        return;
      }

      const session = getLearnerSession();

      if (!session) {
        window.location.replace("/login");
        return;
      }

      setCanShowApp(true);
    }

    function enforceAccessWhenVisible() {
      if (!document.hidden) {
        enforceAccess();
      }
    }

    enforceAccess();
    window.addEventListener("focus", enforceAccess);
    window.addEventListener("pageshow", enforceAccess);
    document.addEventListener("visibilitychange", enforceAccessWhenVisible);

    return () => {
      window.removeEventListener("focus", enforceAccess);
      window.removeEventListener("pageshow", enforceAccess);
      document.removeEventListener("visibilitychange", enforceAccessWhenVisible);
    };
  }, [guarded, pathname]);

  return <PageShellFrame canShowApp={canShowApp}>{children}</PageShellFrame>;
}

function PageShellFrame({ canShowApp, children }: PageShellFrameProps) {
  return (
    <>
      {canShowApp ? (
        <>
          <CourseSelectionSync />
          <AcademicProfileSync />
          <QuizAttemptHistorySync />
          <StudyActivitySync />
          <LessonProgressHistorySync />
        </>
      ) : null}
      <div className="relative isolate z-10 min-h-screen overflow-hidden px-6 pt-32 pb-8 md:px-10 md:pt-36">
        <BackgroundBlur className="-top-40 md:-top-0" />
        <Nav />
        <main className="relative z-10 mx-auto w-full max-w-6xl">{canShowApp ? children : null}</main>
      </div>
      <Footer />
    </>
  );
}
