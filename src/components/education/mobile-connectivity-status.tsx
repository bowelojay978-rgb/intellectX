"use client";

import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileConnectivityStatus() {
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

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300/70 bg-amber-50/90 p-4 text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <WifiOffIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">You&apos;re offline</p>
        <p className="mt-1 text-sm leading-6 opacity-80">
          Live content and account sync may be unavailable until your connection returns.
        </p>
      </div>
    </div>
  );
}
