"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpenIcon, LayoutDashboardIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/instructor", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/instructor/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/instructor/courses/new", label: "Create course", icon: PlusIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/instructor") {
    return pathname === href;
  }

  if (href === "/instructor/courses") {
    return pathname === href;
  }

  return pathname.startsWith("/instructor/courses/new");
}

export function InstructorWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Instructor workspace" className="mb-8 flex flex-wrap gap-2">
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
