import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const scriptPath = "scripts/check-production-env.mjs";

function runPreflight(env: Record<string, string | undefined>, strict = false) {
  return execFileSync(process.execPath, [scriptPath, ...(strict ? ["--strict"] : [])], {
    cwd: process.cwd(),
    env: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("production environment preflight", () => {
  it("passes strict mode when Clerk and Convex auth requirements are present and unsafe flags are disabled", () => {
    const output = runPreflight(
      {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        CLERK_SECRET_KEY: "sk_test_example",
        CLERK_JWT_ISSUER_DOMAIN: "https://example.clerk.accounts.dev",
        ALLOW_LOCAL_USERKEY_FALLBACK: "false",
        NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
      },
      true,
    );

    expect(output).toContain("CLERK_JWT_ISSUER_DOMAIN: present");
    expect(output).toContain("expected template name is convex");
    expect(output).toContain("staff.role, metadata.role, publicMetadata.role, appMetadata.role");
    expect(output).not.toContain("sk_test_example");
  });

  it("fails strict mode when the Clerk issuer is missing or malformed", () => {
    expect(() =>
      runPreflight(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
          CLERK_SECRET_KEY: "sk_test_example",
          ALLOW_LOCAL_USERKEY_FALLBACK: "false",
          NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
        },
        true,
      ),
    ).toThrow();

    expect(() =>
      runPreflight(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
          CLERK_SECRET_KEY: "sk_test_example",
          CLERK_JWT_ISSUER_DOMAIN: "http://example.clerk.accounts.dev",
          ALLOW_LOCAL_USERKEY_FALLBACK: "false",
          NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
        },
        true,
      ),
    ).toThrow();
  });

  it("fails strict mode when production-unsafe fallback or payment flags are enabled", () => {
    expect(() =>
      runPreflight(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
          CLERK_SECRET_KEY: "sk_test_example",
          CLERK_JWT_ISSUER_DOMAIN: "https://example.clerk.accounts.dev",
          ALLOW_LOCAL_USERKEY_FALLBACK: "true",
          NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
        },
        true,
      ),
    ).toThrow();

    expect(() =>
      runPreflight(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
          CLERK_SECRET_KEY: "sk_test_example",
          CLERK_JWT_ISSUER_DOMAIN: "https://example.clerk.accounts.dev",
          ALLOW_LOCAL_USERKEY_FALLBACK: "false",
          NEXT_PUBLIC_PAYMENTS_ENABLED: "true",
        },
        true,
      ),
    ).toThrow();
  });

  it("fails strict mode for mixed-case or padded true values so preflight matches runtime policy", () => {
    const baseEnv = {
      NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      CLERK_SECRET_KEY: "sk_test_example",
      CLERK_JWT_ISSUER_DOMAIN: "https://example.clerk.accounts.dev",
      ALLOW_LOCAL_USERKEY_FALLBACK: "false",
      NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
    };

    expect(() =>
      runPreflight(
        {
          ...baseEnv,
          ALLOW_LOCAL_USERKEY_FALLBACK: " TRUE ",
        },
        true,
      ),
    ).toThrow();

    expect(() =>
      runPreflight(
        {
          ...baseEnv,
          NEXT_PUBLIC_PAYMENTS_ENABLED: "TrUe",
        },
        true,
      ),
    ).toThrow();
  });
});
