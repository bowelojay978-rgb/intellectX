"use client";

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
  }, [guarded, pathname]);

  return (
    <>
      <div className="relative isolate z-10 min-h-screen overflow-hidden px-6 pt-32 pb-8 md:px-10 md:pt-36">
        <BackgroundBlur className="-top-40 md:-top-0" />
        <Nav />
        <main className="relative z-10 mx-auto w-full max-w-6xl">{canShowApp ? children : null}</main>
      </div>
      <Footer />
    </>
  );
}
