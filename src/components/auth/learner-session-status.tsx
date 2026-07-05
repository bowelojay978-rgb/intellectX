"use client";

import { Button } from "@/components/ui/button";
import { clearLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { LogOutIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

type LearnerSessionStatusProps = {
  compact?: boolean;
  session: LearnerSession | null | undefined;
};

export function LearnerSessionStatus({ compact = false, session }: LearnerSessionStatusProps) {
  function handleLogout() {
    clearLearnerSession();
    window.location.assign("/");
  }

  if (session) {
    if (compact) {
      return (
        <div className="border-border/60 bg-background/70 mt-3 grid gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <UserRoundIcon className="size-4" />
            <span className="truncate font-medium">{session.name}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            Log out
          </Button>
        </div>
      );
    }

    return (
      <div className="justify-self-end flex items-center gap-3">
        <Link href="/profile" className="text-muted-foreground hidden max-w-36 truncate text-sm lg:block">
          {session.name}
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          <LogOutIcon className="size-4" />
          Logout
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Signup</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="justify-self-end flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/signup">Signup</Link>
      </Button>
    </div>
  );
}
