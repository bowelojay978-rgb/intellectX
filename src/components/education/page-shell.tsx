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
import { useAuth } from "@clerk/nextjs";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { getLearnerSession } from "@/lib/learner-session";
import { isLearnerAppPath } from "@/lib/learner-routes";
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
  const { isLoaded, isSignedIn } = useAuth();
  const canShowApp = !guarded || (isLoaded && isSignedIn);
  const authEnvironment = getAuthEnvironmentStatus();

  useEffect(() => {
    if (guarded && isLoaded && !isSignedIn) {
      window.location.replace("/login");
    }
  }, [guarded, isLoaded, isSignedIn, pathname]);

  return (
    <>
      {authEnvironment.canRunLocalToAuthMigration ? (
        <LocalLearnerDataMigrationSync isAuthLoaded={isLoaded} isSignedIn={isSignedIn} />
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
