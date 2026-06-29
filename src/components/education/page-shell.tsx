"use client";

import { AcademicProfileSync } from "@/components/education/academic-profile-sync";
import { CourseSelectionSync } from "@/components/education/course-selection-sync";
import { QuizAttemptHistorySync } from "@/components/education/quiz-attempt-history-sync";
import { Footer } from "@/components/footer/footer";
import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { getLearnerSession } from "@/lib/learner-session";
import { isLearnerAppPath } from "@/lib/learner-routes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
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
    <>
      <CourseSelectionSync />
      <AcademicProfileSync />
      <QuizAttemptHistorySync />
      <div className="relative isolate z-10 min-h-screen overflow-hidden px-6 pt-32 pb-8 md:px-10 md:pt-36">
        <BackgroundBlur className="-top-40 md:-top-0" />
        <Nav />
        <main className="relative z-10 mx-auto w-full max-w-6xl">{canShowApp ? children : null}</main>
      </div>
      <Footer />
    </>
  );
}



