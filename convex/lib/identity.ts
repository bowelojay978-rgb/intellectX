import type { Auth, UserIdentity } from "convex/server";

type UserKeyArgs = {
  userKey?: string | null;
};

type AuthContext = {
  auth: Pick<Auth, "getUserIdentity">;
};

export type ResolvedLearnerIdentity = {
  userKey: string;
  source: "authenticated" | "local-fallback";
};

export function getAuthenticatedLearnerUserKey(identity: UserIdentity) {
  return `auth:${identity.tokenIdentifier}`;
}

export function resolveLearnerUserKeyFromIdentity(
  identity: UserIdentity | null,
  fallbackUserKey: string | null | undefined,
): ResolvedLearnerIdentity {
  if (identity) {
    return {
      userKey: getAuthenticatedLearnerUserKey(identity),
      source: "authenticated",
    };
  }

  const trimmedFallbackUserKey = fallbackUserKey?.trim();

  if (trimmedFallbackUserKey) {
    return {
      userKey: trimmedFallbackUserKey,
      source: "local-fallback",
    };
  }

  throw new Error("A learner identity is required for this operation.");
}

export async function resolveLearnerUserKey(ctx: AuthContext, args: UserKeyArgs) {
  const identity = await ctx.auth.getUserIdentity();

  // Temporary compatibility bridge: local/free mode still sends a browser-derived
  // userKey before Convex auth.config.ts is enabled. Do not use this fallback for
  // paid production access or entitlement-protected data.
  return resolveLearnerUserKeyFromIdentity(identity, args.userKey);
}
