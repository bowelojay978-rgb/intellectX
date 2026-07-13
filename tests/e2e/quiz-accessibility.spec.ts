import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({ name: "Quiz Learner", email: "quiz-a11y@example.com", role: "student" }),
    );
    window.localStorage.setItem(
      "intellectx:academic-profile",
      JSON.stringify({
        educationLevel: "Senior",
        curriculumOrInstitution: "Botswana curriculum",
        gradeOrYear: "Form 5",
        subjectsOrModules: ["AI Productivity"],
      }),
    );
  });
});

test("web quiz exposes radio semantics and manages focus across questions, results, and restart", async ({ page }) => {
  await page.goto("/quiz/ai-study-systems-check");

  const firstQuestion = page.getByRole("heading", {
    name: "Which prompt pattern best supports learning?",
    level: 2,
  });
  await expect(firstQuestion).toBeVisible();

  const firstGroup = page.getByRole("radiogroup", { name: "Which prompt pattern best supports learning?" });
  const firstChoices = firstGroup.getByRole("radio");
  await expect(firstChoices).toHaveCount(4);
  await expect(firstChoices.first()).toHaveAttribute("aria-checked", "false");

  await firstChoices.first().focus();
  await firstChoices.first().press("ArrowDown");
  await expect(firstChoices.nth(1)).toBeFocused();
  await expect(firstChoices.nth(1)).toHaveAttribute("aria-checked", "true");

  const visibleTimer = page.getByText(/^Time left:/);
  await expect(visibleTimer).not.toHaveAttribute("aria-live", "polite");

  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: "Next question" }).click();

  const secondQuestion = page.getByRole("heading", {
    name: "What should stay central when using AI-generated practice questions?",
    level: 2,
  });
  await expect(secondQuestion).toBeFocused();

  await page.getByRole("radiogroup", { name: secondQuestion }).getByRole("radio").first().click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: "Next question" }).click();

  const thirdQuestion = page.getByRole("heading", {
    name: "What is the best output of a weekly review?",
    level: 2,
  });
  await expect(thirdQuestion).toBeFocused();

  await page.getByRole("radiogroup", { name: thirdQuestion }).getByRole("radio").first().click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: "See results" }).click();

  const resultsHeading = page.getByRole("heading", { name: /% score$/, level: 2 });
  await expect(resultsHeading).toBeFocused();

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(firstQuestion).toBeFocused();
});
