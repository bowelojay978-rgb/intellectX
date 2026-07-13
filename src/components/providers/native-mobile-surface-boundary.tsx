"use client";

import { isMobileAppRuntime, isRouteWebOnly } from "@/lib/feature-scope";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MOBILE_HOME_ROUTE = "/mobile-quizzes";

export function NativeMobileSurfaceBoundary() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isMobileAppRuntime() || !isRouteWebOnly(pathname)) {
      return;
    }

    router.replace(MOBILE_HOME_ROUTE);
  }, [pathname, router]);

  return null;
}
