import { expect, test } from "@playwright/test";

const localLearnerSession = {
  name: "Onboarding Learner",
  email: "onboarding@example.com",
  role: "student",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem("intellectx:learner-session", JSON.stringify(session));
  }, localLearnerSession);
});

test("interrupted Study Profile onboarding survives refresh and completes into course selection", async ({ page }) => {
  await page.goto("/onboarding");

  const mathematics = page.getByRole("button", { name: "Mathematics", exact: true });
  await expect(mathematics).toBeVisible();
  await mathematics.click();
  await expect(mathematics).toHaveAttribute("aria-pressed", "true");

  await page.reload();

  const restoredMathematics = page.getByRole("button", { name: "Mathematics", exact: true });
  await expect(restoredMathematics).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Continue to course selection" }).click();
  await expect(page).toHaveURL(/\/courses$/);

  const storageState = await page.evaluate(() => ({
    profile: window.localStorage.getItem("intellectx:academic-profile"),
    draft: window.localStorage.getItem("intellectx:academic-profile-draft:local"),
  }));

  expect(storageState.profile).not.toBeNull();
  expect(storageState.draft).toBeNull();
});

test("returning learner with a complete Study Profile is not stranded on onboarding", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:academic-profile",
      JSON.stringify({
        educationLevel: "Senior",
        curriculumOrInstitution: "Botswana curriculum",
        gradeOrYear: "Form 5",
        subjectsOrModules: ["Mathematics", "Biology"],
      }),
    );
  });

  await page.goto("/onboarding");

  await expect(page).toHaveURL(/\/courses$/);
});
