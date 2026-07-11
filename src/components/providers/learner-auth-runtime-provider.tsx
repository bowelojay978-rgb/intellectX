"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useContext, useMemo } from "react";

export type LearnerAuthRuntime = {
  mode: "local" | "clerk";
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
};

const localLearnerAuthRuntime: LearnerAuthRuntime = {
  mode: "local",
  isLoaded: true,
  isSignedIn: false,
  userId: null,
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
  const { isLoaded, isSignedIn, userId } = useAuth();
  const value = useMemo<LearnerAuthRuntime>(
    () => ({
      mode: "clerk",
      isLoaded: Boolean(isLoaded),
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
    }),
    [isLoaded, isSignedIn, userId],
  );

  return <LearnerAuthRuntimeContext.Provider value={value}>{children}</LearnerAuthRuntimeContext.Provider>;
}

export function useLearnerAuthRuntime() {
  return useContext(LearnerAuthRuntimeContext);
}
