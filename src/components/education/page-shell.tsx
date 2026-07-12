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
import { Button } from "@/components/ui/button";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import {
  clearAuthenticatedLearnerLocalData,
  hasPendingLocalLearnerMigrationSource,
  readActiveClerkLearnerUserId,
  shouldClearAuthenticatedLearnerLocalDataForTransition,
  writeActiveClerkLearnerUserId,
} from "@/lib/authenticated-learner-local-data";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import {
  resolveAuthenticatedAppUiState,
  type AuthenticatedAppUiState,
} from "@/lib/auth-ui-state";
import { getLearnerSession } from "@/lib/learner-session";
import { isAuthenticatedAppPath, isLearnerAppPath } from "@/lib/learner-routes";
import { LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PageShellProps = {
  children: React.ReactNode;
};

type PageShellPendingState = Exclude<AuthenticatedAppUiState, "ready">;

type PageShellFrameProps = PageShellProps & {
  canShowApp: boolean;
  pendingState?: PageShellPendingState | null;
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
  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();
  const [preparedUserId, setPreparedUserId] = useState<string | null>(null);
  const authUiState = resolveAuthenticatedAppUiState({
    authenticatedAppPath,
    isLoaded,
    isSignedIn,
    userId,
    preparedUserId,
  });
  const canShowApp = authUiState === "ready";
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
    const hasMigrationSource = hasPendingLocalLearnerMigrationSource();

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
  }, [isLoaded, isSignedIn, userId]);

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
        />
      ) : null}
      <PageShellFrame
        canShowApp={canShowApp}
        pendingState={authUiState === "ready" ? null : authUiState}
      >
        {children}
      </PageShellFrame>
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

  return (
    <PageShellFrame canShowApp={canShowApp} pendingState={canShowApp ? null : "loading-auth"}>
      {children}
    </PageShellFrame>
  );
}

function PageShellFrame({ canShowApp, pendingState = null, children }: PageShellFrameProps) {
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
        <main className="relative z-10 mx-auto w-full max-w-6xl">
          {canShowApp ? children : pendingState ? <AuthPendingState state={pendingState} /> : null}
        </main>
      </div>
      <Footer />
    </>
  );
}

function AuthPendingState({ state }: { state: PageShellPendingState }) {
  const copy = {
    "loading-auth": {
      title: "Checking your session",
      description: "IntellectX is confirming your account before opening your learning space.",
    },
    "redirecting-login": {
      title: "Taking you to login",
      description: "Sign in to continue to your courses and saved learning activity.",
    },
    "preparing-account": {
      title: "Preparing your learning space",
      description: "Your account is ready. IntellectX is loading your courses and learner data.",
    },
  } satisfies Record<PageShellPendingState, { title: string; description: string }>;
  const content = copy[state];

  return (
    <section className="mx-auto flex min-h-[52vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-full shadow-sm">
        <LoaderCircleIcon className="size-5 animate-spin" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-3xl font-medium tracking-tight md:text-4xl">{content.title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md leading-7">{content.description}</p>
      {state === "loading-auth" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
