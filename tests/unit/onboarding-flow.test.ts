import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CLERK_LOGIN_REDIRECT_URL, CLERK_SIGNUP_REDIRECT_URL } from "@/lib/auth-redirects";
import { isLearnerAppPath } from "@/lib/learner-routes";

describe("learner onboarding flow", () => {
  it("routes new Clerk signups through protected onboarding while returning logins go to courses", () => {
    expect(CLERK_SIGNUP_REDIRECT_URL).toBe("/onboarding");
    expect(CLERK_LOGIN_REDIRECT_URL).toBe("/courses");
    expect(isLearnerAppPath("/onboarding")).toBe(true);
  });

  it("keeps Study Profile completion as the onboarding responsibility", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/auth/learner-onboarding.tsx"),
      "utf8",
    );

    expect(source).toContain("<StudyProfileCard");
    expect(source).toContain('router.replace("/courses")');
  });

  it("does not duplicate course-selection persistence inside onboarding", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/auth/learner-onboarding.tsx"),
      "utf8",
    );

    expect(source).not.toContain("saveCourseSelection");
    expect(source).not.toContain("toggleSelectedCourse");
  });
});
