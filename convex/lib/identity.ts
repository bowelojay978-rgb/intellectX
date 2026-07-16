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
  const explicitFallbackPolicy = env.ALLOW_LOCAL_USERKEY_FALLBACK?.trim().toLowerCase();

  // Production is never allowed to accept a browser-supplied owner key, even
  // when an unsafe flag is accidentally carried into the deployment.
  if (env.CONVEX_DEPLOYMENT?.startsWith("prod:") || env.NODE_ENV === "production") {
    return false;
  }

  if (explicitFallbackPolicy === "false") {
    return false;
  }

  // Local fallback requires both an explicit opt-in and an environment that is
  // clearly development/test. An unset or ambiguous environment fails closed.
  return (
    explicitFallbackPolicy === "true" &&
    (env.CONVEX_DEPLOYMENT?.startsWith("dev:") || env.NODE_ENV === "development" || env.NODE_ENV === "test")
  );
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

  // Compatibility bridge for explicitly permitted local development only.
  // Production-like environments deny browser-supplied userKey fallback by default.
  return resolveLearnerUserKeyFromIdentity(identity, args.userKey);
}
