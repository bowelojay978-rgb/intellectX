"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearLearnerSession, getLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { LogOutIcon, MonitorCheckIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileLearnerSessionProps = {
  className?: string;
};

export function ProfileLearnerSession({ className }: ProfileLearnerSessionProps) {
  const [session, setSession] = useState<LearnerSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("intellectx:learner-session-change", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("intellectx:learner-session-change", syncSession);
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

