"use client";

import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const loadingTimeoutMs = 7000;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalNavigation(target: HTMLAnchorElement) {
  const href = target.getAttribute("href");

  if (!href || target.hasAttribute("download") || target.target === "_blank") {
    return false;
  }

  const nextUrl = new URL(href, window.location.href);

  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  const currentUrl = new URL(window.location.href);
  const samePathAndSearch = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;

  if (samePathAndSearch) {
    return false;
  }

  return nextUrl.pathname !== currentUrl.pathname || nextUrl.search !== currentUrl.search;
}

export function GlobalNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(false);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    function startLoading() {
      setLoading(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setLoading(false);
        timeoutRef.current = null;
      }, loadingTimeoutMs);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;

      if (!(target instanceof HTMLAnchorElement) || !isInternalNavigation(target)) {
        return;
      }

      startLoading();
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!loading) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="global-navigation-loader"
      className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-background/20 backdrop-blur-[1px]"
    >
      <AppLoadingSpinner />
    </div>
  );
}
