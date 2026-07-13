"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const tabs = [
  { href: "/mobile-quizzes/", label: "Quizzes" },
  { href: "/mobile-flashcards/", label: "Flashcards" },
] as const;

function isActive(pathname: string, href: string) {
  const normalizedHref = href.endsWith("/") ? href.slice(0, -1) : href;
  return pathname === normalizedHref || pathname === href;
}

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateConnectivity = () => setIsOnline(window.navigator.onLine);

    updateConnectivity();
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);

    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <Link className="mobile-brand" href="/mobile-quizzes/">
          IntellectX
        </Link>
        <span className="mobile-badge">Free mobile</span>
      </header>

      <main className="mobile-main">
        {!isOnline ? (
          <div className="mobile-offline" role="status" aria-live="polite">
            <span aria-hidden="true">●</span>
            <div>
              <strong>You&apos;re offline</strong>
              <div>Live content and account sync may be unavailable until your connection returns.</div>
            </div>
          </div>
        ) : null}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Mobile study navigation">
        <div className="mobile-nav-inner">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="mobile-nav-link"
              aria-current={isActive(pathname, tab.href) ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
