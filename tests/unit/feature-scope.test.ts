import { describe, expect, it } from "vitest";

import { isFeatureAllowedOnMobile, isRouteWebOnly } from "@/lib/feature-scope";

describe("native mobile feature scope", () => {
  it("keeps the free mobile study surface limited to quizzes and flashcards", () => {
    expect(isFeatureAllowedOnMobile("quizzes")).toBe(true);
    expect(isFeatureAllowedOnMobile("flashcards")).toBe(true);
    expect(isFeatureAllowedOnMobile("notes")).toBe(false);
  });

  it("allows native study, quiz, auth, onboarding, and legal routes", () => {
    for (const pathname of [
      "/mobile-study",
      "/mobile-quizzes",
      "/mobile-flashcards",
      "/quiz/ai-study-systems-check",
      "/login",
      "/signup",
      "/forgot-password",
      "/auth/continue",
      "/onboarding",
      "/privacy-policy",
      "/terms-and-conditions",
      "/refund-policy",
    ]) {
      expect(isRouteWebOnly(pathname)).toBe(false);
    }
  });

  it("keeps web-only learner surfaces and removed mobile notes outside native scope", () => {
    for (const pathname of ["/", "/courses", "/dashboard", "/progress", "/quizzes", "/flashcards", "/mobile-notes"]) {
      expect(isRouteWebOnly(pathname)).toBe(true);
    }
  });

  it("does not allow lookalike paths that only share a string prefix", () => {
    expect(isRouteWebOnly("/mobile-quizzesevil")).toBe(true);
    expect(isRouteWebOnly("/loginsomething")).toBe(true);
    expect(isRouteWebOnly("/authentic-looking")).toBe(true);
  });
});
