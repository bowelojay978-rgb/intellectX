"use client";

import { MobileNav } from "@/components/hero/mobile-nav";
import { DesktopNav } from "@/components/hero/desktop-nav";
import { getLearnerSession, type LearnerSession } from "@/lib/learner-session";
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

export function Nav() {
  const [session, setSession] = useState<LearnerSession | null>(null);

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

  const navItems = session ? authenticatedNavItems : publicNavItems;
  const logoHref = session ? "/courses" : "/";

  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} logoHref={logoHref} />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} />
    </>
  );
}
