"use client";

import { MobileNav } from "@/components/hero/mobile-nav";
import { DesktopNav } from "@/components/hero/desktop-nav";
import { getLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { isLearnerAppPath } from "@/lib/learner-routes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const publicNavItems = [
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "How it works",
    href: "/#features",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
];

const appNavItems = [
  {
    label: "Courses",
    href: "/courses",
  },
  {
    label: "Quizzes",
    href: "/quizzes",
  },
  {
    label: "Progress",
    href: "/progress",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Profile",
    href: "/profile",
  },
];

type SessionState = LearnerSession | null | undefined;

export function Nav() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(undefined);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("intellectx:learner-session-change", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("intellectx:learner-session-change", syncSession);
    };
  }, []);

  const isAppRoute = isLearnerAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || Boolean(session);
  const navItems = showAuthenticatedNav ? appNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";
  const navState = showAuthenticatedNav ? "app" : "public";

  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} logoHref={logoHref} session={session} navState={navState} />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} session={session} navState={navState} />
    </>
  );
}
