import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CLERK_LOGIN_REDIRECT_URL, CLERK_SIGNUP_REDIRECT_URL } from "@/lib/auth-redirects";
import { isLearnerAppPath } from "@/lib/learner-routes";

const onboardingSource = readFileSync(
  path.resolve(process.cwd(), "src/components/auth/learner-onboarding.tsx"),
  "utf8",
);

describe("learner onboarding flow", () => {
  it("routes new Clerk signups through protected onboarding while returning logins resolve trusted roles", () => {
    expect(CLERK_SIGNUP_REDIRECT_URL).toBe("/onboarding");
    expect(CLERK_LOGIN_REDIRECT_URL).toBe("/auth/continue");
    expect(isLearnerAppPath("/onboarding")).toBe(true);
  });

  it("keeps Study Profile completion as the onboarding responsibility", () => {
    expect(onboardingSource).toContain("<StudyProfileCard");
    expect(onboardingSource).toContain("router.replace(getLearnerHomeRouteForCurrentRuntime())");
  });

  it("continues returning learners when a complete Study Profile is already available or hydrates later", () => {
    expect(onboardingSource).toContain("continueIfProfileComplete");
    expect(onboardingSource).toContain("isAcademicProfileComplete(loadAcademicProfile())");
    expect(onboardingSource).toContain("ACADEMIC_PROFILE_CHANGE_EVENT");
    expect(onboardingSource).toContain("Checking your Study Profile…");
  });

  it("scopes interrupted onboarding drafts to the active learner identity", () => {
    expect(onboardingSource).toContain('mode === "clerk" ? userId ?? undefined : "local"');
    expect(onboardingSource).toContain("draftScope={draftScope}");
  });

  it("does not duplicate course-selection persistence inside onboarding", () => {
    expect(onboardingSource).not.toContain("saveCourseSelection");
    expect(onboardingSource).not.toContain("toggleSelectedCourse");
  });
});
