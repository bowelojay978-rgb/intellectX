"use client";

import { MobileNav } from "@/components/hero/mobile-nav";
import { DesktopNav } from "@/components/hero/desktop-nav";
import { useUser } from "@clerk/nextjs";
import { getLearnerSession, LEARNER_SESSION_CHANGE_EVENT, type LearnerSession } from "@/lib/learner-session";
import { isLearnerAppPath } from "@/lib/learner-routes";
import { usePathname, useRouter } from "next/navigation";
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

type MaybeCapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
};

function isNativeAppSurface() {
  const maybeWindow = window as MaybeCapacitorWindow;

  if (maybeWindow.Capacitor?.isNativePlatform?.()) {
    return true;
  }

  const platform = maybeWindow.Capacitor?.getPlatform?.();
  return platform === "ios" || platform === "android";
}

export function Nav() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkNav />;
  }

  return <LocalSessionNav />;
}

function ClerkNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && pathname === "/" && isNativeAppSurface()) {
      router.replace("/courses");
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  const isAppRoute = isLearnerAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || (isLoaded && isSignedIn);
  const navItems = showAuthenticatedNav ? appNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";

  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} logoHref={logoHref} session={null} />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} session={null} />
    </>
  );
}

function LocalSessionNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(undefined);

  useEffect(() => {
    function syncSession() {
      const nextSession = getLearnerSession();
      setSession(nextSession);

      if (nextSession && pathname === "/" && isNativeAppSurface()) {
        router.replace("/courses");
      }
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
  }, [pathname, router]);

  const isAppRoute = isLearnerAppPath(pathname);
  const showAuthenticatedNav = isAppRoute || Boolean(session);
  const navItems = showAuthenticatedNav ? appNavItems : publicNavItems;
  const logoHref = showAuthenticatedNav ? "/courses" : "/";

  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} logoHref={logoHref} session={session} />
      <DesktopNav className="hidden md:flex" items={navItems} logoHref={logoHref} session={session} />
    </>
  );
}
