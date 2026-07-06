import type { Auth, UserIdentity } from "convex/server";

type UserKeyArgs = {
  userKey?: string | null;
};

type AuthContext = {
  auth: Pick<Auth, "getUserIdentity">;
};

type IdentityPolicyEnv = Partial<Record<"ALLOW_LOCAL_USERKEY_FALLBACK" | "CONVEX_DEPLOYMENT" | "NODE_ENV", string>>;

export type ResolvedLearnerIdentity = {
  userKey: string;
  source: "authenticated" | "local-fallback";
};

export function getAuthenticatedLearnerUserKey(identity: UserIdentity) {
  return `auth:${identity.tokenIdentifier}`;
}

export function isLocalUserKeyFallbackAllowed(env: IdentityPolicyEnv = process.env as IdentityPolicyEnv) {
  const explicitFallbackPolicy = env.ALLOW_LOCAL_USERKEY_FALLBACK?.toLowerCase();

  if (explicitFallbackPolicy === "true") {
    return true;
  }

  if (explicitFallbackPolicy === "false") {
    return false;
  }

  if (env.CONVEX_DEPLOYMENT?.startsWith("dev:")) {
    return true;
  }

  if (env.CONVEX_DEPLOYMENT?.startsWith("prod:") || env.NODE_ENV === "production") {
    return false;
  }

  return env.NODE_ENV === "development" || env.NODE_ENV === "test";
}

export function resolveLearnerUserKeyFromIdentity(
  identity: UserIdentity | null,
  fallbackUserKey: string | null | undefined,
  env?: IdentityPolicyEnv,
): ResolvedLearnerIdentity {
  if (identity) {
    return {
      userKey: getAuthenticatedLearnerUserKey(identity),
      source: "authenticated",
    };
  }

  const trimmedFallbackUserKey = fallbackUserKey?.trim();

  if (trimmedFallbackUserKey) {
    if (!isLocalUserKeyFallbackAllowed(env)) {
      throw new Error(
        "Authenticated learner identity is required. Local userKey fallback is disabled for this environment.",
      );
    }

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
  // userKey before Convex auth.config.ts is enabled. This fallback is denied by
  // default in production-like environments; opt in only for local development.
  return resolveLearnerUserKeyFromIdentity(identity, args.userKey);
}
