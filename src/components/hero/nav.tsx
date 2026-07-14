"use client";

import { DesktopNav } from "@/components/hero/desktop-nav";
import { MobileNav } from "@/components/hero/mobile-nav";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { isMobileAppRuntime } from "@/lib/feature-scope";
import { getLearnerSession, LEARNER_SESSION_CHANGE_EVENT, type LearnerSession } from "@/lib/learner-session";
import { isAuthenticatedAppPath } from "@/lib/learner-routes";
import { resolveMobileNavigationSurface } from "@/lib/navigation-surface";
import { useLearnerAccessState } from "@/lib/use-learner-access-state";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const publicNavItems = [
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "How it works",
    href: "/#how-it-works",
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
  {
    label: "Search",
    href: "/search",
  },
];

const mobileFreeNavItems = [
  {
    label: "Quizzes",
    href: "/mobile-quizzes",
  },
  {
    label: "Flashcards",
    href: "/mobile-flashcards",
  },
];

type SessionState = LearnerSession | null | undefined;

function useNativeAppSurface() {
  const [nativeAppSurface, setNativeAppSurface] = useState(false);

  useEffect(() => {
    setNativeAppSurface(isMobileAppRuntime());
  }, []);

  return nativeAppSurface;
}

export function Nav() {
  if (isClerkAuthEnabled()) {
    return <ClerkNav />;
  }

  return <LocalSessionNav />;
}

function ClerkNav() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useLearnerAccessState();
  const nativeAppSurface = useNativeAppSurface();
  const isAppRoute = isAuthenticatedAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || (isLoaded && isSignedIn);
  const navItems = !isLoaded && !isAppRoute ? [] : showAuthenticatedNav ? appNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";
  const mobileNavigation = resolveMobileNavigationSurface({
    nativeAppSurface,
    webItems: navItems,
    webLogoHref: logoHref,
    nativeItems: mobileFreeNavItems,
    nativeLogoHref: "/mobile-quizzes",
  });

  return (
    <>
      <MobileNav
        className="flex md:hidden"
        items={mobileNavigation.items}
        logoHref={mobileNavigation.logoHref}
        session={null}
      />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} session={null} />
    </>
  );
}

function LocalSessionNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(undefined);
  const nativeAppSurface = useNativeAppSurface();

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    function syncSessionWhenVisible() {
      if (!document.hidden) {
        syncSession();
      }
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    window.addEventListener("pageshow", syncSession);
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);
    document.addEventListener("visibilitychange", syncSessionWhenVisible);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("pageshow", syncSession);
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);
      document.removeEventListener("visibilitychange", syncSessionWhenVisible);
    };
  }, []);

  const isAppRoute = isAuthenticatedAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || Boolean(session);
  const navItems = showAuthenticatedNav ? appNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";
  const mobileNavigation = resolveMobileNavigationSurface({
    nativeAppSurface,
    webItems: navItems,
    webLogoHref: logoHref,
    nativeItems: mobileFreeNavItems,
    nativeLogoHref: "/mobile-quizzes",
  });

  return (
    <>
      <MobileNav
        className="flex md:hidden"
        items={mobileNavigation.items}
        logoHref={mobileNavigation.logoHref}
        session={session}
      />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} session={session} />
    </>
  );
}
