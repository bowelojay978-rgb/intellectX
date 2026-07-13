import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({ name: "Profile Learner", email: "profile-state@example.com", role: "student" }),
    );
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
});

test("saved study profile stays in a stable saved state until the learner chooses to edit it", async ({ page }) => {
  await page.goto("/profile");

  await expect(page.getByText("Saved on this device")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save study profile" })).toHaveCount(0);
  await expect(page.getByLabel("Academic level")).toBeDisabled();

  await page.getByRole("button", { name: "Edit profile" }).click();

  await expect(page.getByLabel("Academic level")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Save study profile" })).toBeDisabled();

  await page.getByLabel("Grade").selectOption("Form 4");

  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save study profile" })).toBeEnabled();

  await page.getByRole("button", { name: "Save study profile" }).click();

  await expect(page.getByText("Saved on this device")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save study profile" })).toHaveCount(0);
  await expect(page.getByLabel("Grade")).toBeDisabled();
});
