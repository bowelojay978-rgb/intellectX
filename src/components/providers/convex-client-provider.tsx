"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import { useMemo } from "react";

type ConvexClientProviderProps = {
  children: React.ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkAuthEnabled = isClerkAuthEnabled();
  const client = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl]);

  if (!client) {
    if (!clerkAuthEnabled || !clerkPublishableKey) {
      return <>{children}</>;
    }

    return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
  }

  if (!clerkAuthEnabled || !clerkPublishableKey) {
    return <ConvexProvider client={client}>{children}</ConvexProvider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
