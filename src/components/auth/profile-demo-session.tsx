"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearDemoSession, getDemoSession, type DemoSession } from "@/lib/demo-auth";
import { LogOutIcon, MonitorCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProfileDemoSessionProps = {
  className?: string;
};

export function ProfileDemoSession({ className }: ProfileDemoSessionProps) {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getDemoSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("intellectx-demo-session-change", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("intellectx-demo-session-change", syncSession);
    };
  }, []);

  function handleLogout() {
    clearDemoSession();
    router.push("/");
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCheckIcon className="size-5" />
          Demo session
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
            <p>No local demo session is active. Login or signup will create one in this browser only.</p>
            <Button asChild className="w-fit">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
