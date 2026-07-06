"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserButton, useUser } from "@clerk/nextjs";
import { getClerkDisplayName } from "@/lib/auth-identity";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import {
  clearLearnerSession,
  getLearnerSession,
  LEARNER_SESSION_CHANGE_EVENT,
  type LearnerSession,
} from "@/lib/learner-session";
import { LogOutIcon, MonitorCheckIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileLearnerSessionProps = {
  className?: string;
};

export function ProfileLearnerSession({ className }: ProfileLearnerSessionProps) {
  if (isClerkAuthEnabled()) {
    return <ClerkProfileLearnerSession className={className} />;
  }

  return <LocalProfileLearnerSession className={className} />;
}

function ClerkProfileLearnerSession({ className }: ProfileLearnerSessionProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCheckIcon className="size-5" />
          Learner session
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground grid gap-4 text-sm leading-6">
        {isLoaded && isSignedIn && user ? (
          <>
            <div>
              <p className="text-foreground font-medium">{getClerkDisplayName(user)}</p>
              {user.primaryEmailAddress?.emailAddress ? <p>{user.primaryEmailAddress.emailAddress}</p> : null}
              <p>Account-backed session</p>
            </div>
            <div className="w-fit">
              <UserButton />
            </div>
          </>
        ) : (
          <>
            <p>No account-backed learner session is active. Login or signup will create one for this browser.</p>
            <Button asChild className="w-fit">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LocalProfileLearnerSession({ className }: ProfileLearnerSessionProps) {
  const [session, setSession] = useState<LearnerSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  function handleLogout() {
    clearLearnerSession();
    window.location.assign("/");
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCheckIcon className="size-5" />
          Learner session
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground grid gap-4 text-sm leading-6">
        {session ? (
          <>
            <div>
              <p className="text-foreground font-medium">{session.name}</p>
              <p>{session.email}</p>
              <p className="capitalize">Role: {session.role}</p>
            </div>
            <Button type="button" variant="outline" className="w-fit" onClick={handleLogout}>
              <LogOutIcon className="size-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <p>No local learner session is active. Login or signup will create one in this browser only.</p>
            <Button asChild className="w-fit">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
