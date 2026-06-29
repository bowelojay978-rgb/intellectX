"use client";

import { LearnerSessionStatus } from "@/components/auth/learner-session-status";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  items: {
    label: string;
    href: string;
  }[];
  logoHref?: string;
  className?: string;
};

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/quizzes") {
    return pathname === "/quizzes" || pathname.startsWith("/quiz/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ items, logoHref = "/", className }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 flex w-full items-center bg-transparent px-6 py-8 md:px-10",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href={logoHref} className="flex items-center gap-2 justify-self-start font-semibold tracking-tight">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full">
            <SparklesIcon className="size-4" />
          </span>
          <span>IntellectX</span>
        </Link>
        <NavigationMenu className="flex-none">
          <NavigationMenuList className="gap-5">
            {items.map((item) => {
              const isActive = isActiveNavItem(pathname, item.href);

              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative after:absolute after:right-3 after:-bottom-0.5 after:left-3 after:h-px after:origin-center after:scale-x-0 after:bg-white/85 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100",
                      isActive && "text-foreground after:scale-x-100",
                    )}
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <LearnerSessionStatus />
      </div>
    </nav>
  );
}
