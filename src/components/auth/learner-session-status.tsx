"use client";

import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { Button } from "@/components/ui/button";
import { getClerkDisplayName } from "@/lib/auth-identity";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { clearLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { UserButton, useUser } from "@clerk/nextjs";
import { LogOutIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

type LearnerSessionStatusProps = {
  compact?: boolean;
  session: LearnerSession | null | undefined;
};

export function LearnerSessionStatus({ compact = false, session }: LearnerSessionStatusProps) {
  if (isClerkAuthEnabled()) {
    return <ClerkLearnerSessionStatus compact={compact} />;
  }

  return <LocalLearnerSessionStatus compact={compact} session={session} />;
}

function ClerkLearnerSessionStatus({ compact = false }: Pick<LearnerSessionStatusProps, "compact">) {
  const { isLoaded, isSignedIn } = useLearnerAuthRuntime();
  const { user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    if (!user) {
      return null;
    }

    const displayName = getClerkDisplayName(user);
    const email = user.primaryEmailAddress?.emailAddress;

    if (compact) {
      return (
        <div className="border-border/60 bg-background/70 mt-3 grid gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <UserButton signInUrl="/login" afterSwitchSessionUrl="/auth/continue" />
            <span className="truncate font-medium">{displayName}</span>
          </div>
          {email ? <p className="text-muted-foreground truncate text-xs">{email}</p> : null}
        </div>
      );
    }

    return (
      <div className="justify-self-end flex items-center gap-3">
        <Link href="/profile" className="text-muted-foreground hidden max-w-36 truncate text-sm lg:block">
          {displayName}
        </Link>
        <UserButton signInUrl="/login" afterSwitchSessionUrl="/auth/continue" />
      </div>
    );
  }

  return <SignedOutLinks compact={compact} />;
}

function LocalLearnerSessionStatus({ compact = false, session }: LearnerSessionStatusProps) {
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

  return <SignedOutLinks compact={compact} />;
}

function SignedOutLinks({ compact = false }: Pick<LearnerSessionStatusProps, "compact">) {
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
