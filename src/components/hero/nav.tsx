"use client";

import { MobileNav } from "@/components/hero/mobile-nav";
import { DesktopNav } from "@/components/hero/desktop-nav";
import { getLearnerSession, type LearnerSession } from "@/lib/learner-session";
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

const authenticatedNavItems = [
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

function isAuthenticatedAppPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/quizzes" ||
    pathname === "/progress" ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/quiz/")
  );
}

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

  const isAppRoute = isAuthenticatedAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || Boolean(session);
  const navItems = showAuthenticatedNav ? authenticatedNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";

  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} logoHref={logoHref} />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} />
    </>
  );
}
