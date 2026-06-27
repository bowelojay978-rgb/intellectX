"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

type ConvexClientProviderProps = {
  children: React.ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl]);

  if (!client) {
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
