"use client";

import { MobileConnectivityStatus } from "@/components/education/mobile-connectivity-status";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { cn } from "@/lib/utils";
import { BookOpenCheckIcon, Layers3Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/mobile-quizzes", label: "Quizzes", icon: BookOpenCheckIcon },
  { href: "/mobile-flashcards", label: "Flashcards", icon: Layers3Icon },
];

type MobileAppShellProps = {
  children: React.ReactNode;
};

function isTabActive(pathname: string, href: string) {
  if (href === "/mobile-quizzes") {
    return pathname === href || pathname.startsWith("/quiz/");
  }

  return pathname === href;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-background px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <BackgroundBlur className="-top-48" />

      <header className="sticky top-[calc(0.5rem+env(safe-area-inset-top))] z-20 mx-auto mb-5 flex w-full max-w-md items-center justify-between rounded-full border border-white/70 bg-background/85 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10">
        <Link href="/mobile-quizzes" className="text-sm font-semibold tracking-tight">
          IntellectX
        </Link>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Free mobile
        </span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md">
        <MobileConnectivityStatus />
        {children}
      </main>

      <nav
        aria-label="Mobile study navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-background/90 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition",
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
