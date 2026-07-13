import { Button } from "@/components/ui/button";
import { BookOpenCheckIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

export function AdminWorkspaceNav() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Admin workspace">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin">
          <LayoutDashboardIcon className="size-4" />
          Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/course-review">
          <BookOpenCheckIcon className="size-4" />
          Course review
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/instructors">
          <UsersIcon className="size-4" />
          Instructors
        </Link>
      </Button>
    </nav>
  );
}
