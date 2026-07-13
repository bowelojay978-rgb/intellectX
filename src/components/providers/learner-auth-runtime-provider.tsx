"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { createContext, useContext, useMemo } from "react";

export type LearnerAuthRuntime = {
  mode: "local" | "clerk";
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  primaryEmailAddress: string | null;
};

const localLearnerAuthRuntime: LearnerAuthRuntime = {
  mode: "local",
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  primaryEmailAddress: null,
};

const LearnerAuthRuntimeContext = createContext<LearnerAuthRuntime>(localLearnerAuthRuntime);

type LearnerAuthRuntimeProviderProps = {
  children: React.ReactNode;
};

export function LocalLearnerAuthRuntimeProvider({ children }: LearnerAuthRuntimeProviderProps) {
  return (
    <LearnerAuthRuntimeContext.Provider value={localLearnerAuthRuntime}>
      {children}
    </LearnerAuthRuntimeContext.Provider>
  );
}

export function ClerkLearnerAuthRuntimeProvider({ children }: LearnerAuthRuntimeProviderProps) {
  const { isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const primaryEmailAddress = user?.primaryEmailAddress?.emailAddress ?? null;
  const isLoaded = Boolean(isAuthLoaded && (!isSignedIn || isUserLoaded));
  const value = useMemo<LearnerAuthRuntime>(
    () => ({
      mode: "clerk",
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      primaryEmailAddress,
    }),
    [isLoaded, isSignedIn, primaryEmailAddress, userId],
  );

  return <LearnerAuthRuntimeContext.Provider value={value}>{children}</LearnerAuthRuntimeContext.Provider>;
}

export function useLearnerAuthRuntime() {
  return useContext(LearnerAuthRuntimeContext);
}
