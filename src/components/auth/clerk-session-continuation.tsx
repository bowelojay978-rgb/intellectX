"use client";

import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { resolvePostLoginRouteFromClaims } from "@/lib/post-login-route";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

type ClerkSessionContinuationProps = {
  signedOutDestination?: string;
};

export function ClerkSessionContinuation({ signedOutDestination = "/login" }: ClerkSessionContinuationProps) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const destination = isSignedIn
      ? resolvePostLoginRouteFromClaims(sessionClaims)
      : signedOutDestination;

    window.location.replace(destination);
  }, [isLoaded, isSignedIn, sessionClaims, signedOutDestination]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <AppLoadingSpinner label="Continuing to IntellectX" size="md" showLabel />
    </main>
  );
}
