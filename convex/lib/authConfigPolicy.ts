type AuthConfigEnv = Partial<Record<"CLERK_JWT_ISSUER_DOMAIN", string>>;

export function requireClerkJwtIssuerDomain(env: AuthConfigEnv = process.env as AuthConfigEnv) {
  const issuer = env.CLERK_JWT_ISSUER_DOMAIN?.trim();

  if (!issuer) {
    throw new Error("CLERK_JWT_ISSUER_DOMAIN is required for Convex Clerk authentication.");
  }

  let parsed: URL;

  try {
    parsed = new URL(issuer);
  } catch {
    throw new Error("CLERK_JWT_ISSUER_DOMAIN must be a valid https URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("CLERK_JWT_ISSUER_DOMAIN must be a valid https URL.");
  }

  return issuer;
}
