import { expect, test } from "@playwright/test";

async function seedCourseSelectionScenario(
  page: import("@playwright/test").Page,
  options: { locked?: boolean } = {},
) {
  const { locked = false } = options;

  await page.addInitScript(({ locked }) => {
    const now = Date.now();
    const selectedAt = locked ? now - 8 * 24 * 60 * 60 * 1000 : now;
    const gracePeriodEndsAt = selectedAt + 7 * 24 * 60 * 60 * 1000;

    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({
        name: "Course Selection Learner",
        email: "course-selection-resilience@intellectx.local",
        role: "student",
      }),
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
    window.localStorage.setItem(
      "intellectx:course-selection",
      JSON.stringify({
        selectedCourseIds: ["exam-accelerator"],
        selectedAt,
        gracePeriodEndsAt,
        lockedAt: locked ? gracePeriodEndsAt : null,
        locked,
      }),
    );
  }, { locked });
}

test("selected courses outside the filtered course list remain visible and removable", async ({ page }) => {
  await seedCourseSelectionScenario(page);
  await page.goto("/courses");

  const filters = page.getByRole("region", { name: "Course filters" });

  await expect(filters.getByText("1 / 5 selected")).toBeVisible();
  await expect(filters.getByText("Other selected courses")).toBeVisible();

  const hiddenSelection = filters.getByRole("button", { name: "Remove selected course Exam Accelerator" });
  await expect(hiddenSelection).toBeVisible();
  await expect(hiddenSelection).toBeEnabled();

  await hiddenSelection.click();

  await expect(filters.getByText("0 / 5 selected")).toBeVisible();
  await expect(filters.getByText("Other selected courses")).toHaveCount(0);

  const selectedCourseIds = await page.evaluate(() => {
    const stored = window.localStorage.getItem("intellectx:course-selection");
    return stored ? (JSON.parse(stored).selectedCourseIds as string[]) : null;
  });

  expect(selectedCourseIds).toEqual([]);
});

test("locked hidden selections remain visible but read-only", async ({ page }) => {
  await seedCourseSelectionScenario(page, { locked: true });
  await page.goto("/courses");

  const filters = page.getByRole("region", { name: "Course filters" });
  const hiddenSelection = filters.getByRole("button", { name: "Remove selected course Exam Accelerator" });

  await expect(filters.getByText("1 / 5 selected")).toBeVisible();
  await expect(filters.getByText("Selection locked")).toBeVisible();
  await expect(filters.getByText("Other selected courses")).toBeVisible();
  await expect(hiddenSelection).toBeDisabled();
});
