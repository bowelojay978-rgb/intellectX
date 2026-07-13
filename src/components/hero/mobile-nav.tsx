import { LearnerSessionStatus } from "@/components/auth/learner-session-status";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import type { LearnerSession } from "@/lib/learner-session";
import { cn } from "@/lib/utils";
import { Menu, SparklesIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  items: {
    label: string;
    href: string;
  }[];
  logoHref?: string;
  session: LearnerSession | null | undefined;
  className?: string;
};

export function MobileNav({ items, logoHref = "/", session, className }: Props) {
  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 w-full items-center bg-transparent px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href={logoHref} className="flex min-h-11 touch-manipulation items-center gap-2 font-semibold tracking-tight">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full">
            <SparklesIcon className="size-4" />
          </span>
          <span>IntellectX</span>
        </Link>
        <Drawer direction="top">
          <DrawerTrigger className="relative -m-2 grid min-h-11 min-w-11 touch-manipulation cursor-pointer place-items-center p-2">
            <span className="sr-only">Open menu</span>
            <Menu className="h-6 w-6" />
          </DrawerTrigger>
          <DrawerContent className="flex flex-col gap-4 px-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-11 touch-manipulation items-center">
                {item.label}
              </Link>
            ))}
            <LearnerSessionStatus compact session={session} />
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
