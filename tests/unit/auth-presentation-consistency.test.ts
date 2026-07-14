import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("frontend authentication presentation consistency", () => {
  const navSource = readSource("src/components/hero/nav.tsx");
  const heroSource = readSource("src/components/hero/hero.tsx");
  const sessionStatusSource = readSource("src/components/auth/learner-session-status.tsx");
  const pageShellSource = readSource("src/components/education/page-shell.tsx");

  it("drives Hero and Clerk navigation from the same centralized learner access state", () => {
    expect(heroSource).toContain("useLearnerAccessState()");
    expect(navSource).toContain("useLearnerAccessState()");
    expect(navSource).not.toContain('from "@clerk/nextjs"');
    expect(navSource).not.toContain("useUser()");
  });

  it("does not expose signed-out homepage CTAs while Clerk readiness is unresolved", () => {
    expect(heroSource).toContain("const authPending = !isLoaded");
    expect(heroSource).toContain("Checking your learning workspace");
    expect(heroSource).toContain("Checking session…");
    expect(heroSource).toContain("{authPending ? (");
    expect(heroSource).toContain("<LearnerEntryLink signedInHref=\"/dashboard\">");
  });

  it("keeps Clerk session controls aligned with centralized auth readiness", () => {
    expect(sessionStatusSource).toContain("useLearnerAuthRuntime()");
    expect(sessionStatusSource).toContain("const { user } = useUser()");
    expect(sessionStatusSource).not.toContain("const { isLoaded, isSignedIn, user } = useUser()");
    expect(sessionStatusSource).toContain('afterSwitchSessionUrl="/auth/continue"');
  });

  it("preserves account-transition cleanup keyed to the actual Clerk userId", () => {
    expect(pageShellSource).toContain("shouldClearAuthenticatedLearnerLocalDataForTransition");
    expect(pageShellSource).toContain("previousUserId");
    expect(pageShellSource).toContain("nextUserId: userId");
    expect(pageShellSource).toContain("clearAuthenticatedLearnerLocalData()");
    expect(pageShellSource).toContain("writeActiveClerkLearnerUserId(userId)");
  });
});
