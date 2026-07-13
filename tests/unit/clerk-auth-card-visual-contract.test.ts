import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const authPanelSource = readFileSync(
  path.join(process.cwd(), "src/components/auth/clerk-auth-panel.tsx"),
  "utf8",
);

describe("Clerk auth card visual restoration contract", () => {
  it("restores the original IntellectX card treatment without the later security callout or spacing overrides", () => {
    expect(authPanelSource).not.toContain("ShieldCheckIcon");
    expect(authPanelSource).not.toContain("Clerk securely verifies the account");
    expect(authPanelSource).not.toContain('borderRadius: "0.5rem"');
    expect(authPanelSource).not.toContain('main: "gap-4"');
    expect(authPanelSource).not.toContain('form: "gap-4"');
    expect(authPanelSource).not.toContain('footer: "mt-5 border-t border-border/60 pt-5"');
    expect(authPanelSource).toContain('<CardContent>');
  });

  it("preserves current Clerk authentication and trusted post-login routing behavior", () => {
    expect(authPanelSource).toContain("SignIn, SignUp, useAuth");
    expect(authPanelSource).toContain("resolvePostLoginRouteFromClaims(sessionClaims)");
    expect(authPanelSource).toContain("CLERK_LOGIN_REDIRECT_URL");
    expect(authPanelSource).toContain("CLERK_SIGNUP_REDIRECT_URL");
    expect(authPanelSource).toContain('label="Checking your IntellectX session"');
  });
});
