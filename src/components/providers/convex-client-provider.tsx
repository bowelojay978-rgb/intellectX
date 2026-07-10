"use client";

import {
  ClerkLearnerAuthRuntimeProvider,
  LocalLearnerAuthRuntimeProvider,
} from "@/components/providers/learner-auth-runtime-provider";
import { getAuthEnvironmentStatus } from "@/lib/auth-env";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo } from "react";

type ConvexClientProviderProps = {
  children: React.ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const authEnvironment = getAuthEnvironmentStatus();
  const client = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl]);

  if (!client) {
    if (!authEnvironment.clerkPublishableKeyPresent || !clerkPublishableKey) {
      return <LocalLearnerAuthRuntimeProvider>{children}</LocalLearnerAuthRuntimeProvider>;
    }

    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ClerkLearnerAuthRuntimeProvider>{children}</ClerkLearnerAuthRuntimeProvider>
      </ClerkProvider>
    );
  }

  if (!authEnvironment.clerkPublishableKeyPresent || !clerkPublishableKey) {
    return (
      <ConvexProvider client={client}>
        <LocalLearnerAuthRuntimeProvider>{children}</LocalLearnerAuthRuntimeProvider>
      </ConvexProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ClerkLearnerAuthRuntimeProvider>
        <ConvexProviderWithClerk client={client} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkLearnerAuthRuntimeProvider>
    </ClerkProvider>
  );
}
