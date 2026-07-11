"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardCheckIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/admin/course-review", label: "Course review", icon: ClipboardCheckIcon },
  { href: "/admin/instructors", label: "Instructors", icon: UsersIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AdminWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin workspace" className="mb-8 flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Button key={item.href} variant={active ? "default" : "outline"} size="sm" asChild>
            <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("gap-2")}>
              <Icon className="size-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
