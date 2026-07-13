import { expect, test } from "@playwright/test";

test("dashboard opens flashcards in the protected web experience", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({
        name: "Playwright Learner",
        email: "flashcards@intellectx.local",
        role: "student",
      }),
    );
  });

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Open flashcards" })).toHaveAttribute("href", "/flashcards");
  await page.getByRole("link", { name: "Open flashcards" }).click();

  await expect(page).toHaveURL(/\/flashcards$/);
  await expect(page.getByRole("heading", { name: "Flashcards for focused review" })).toBeVisible();
  await expect(page.getByText("Free mobile")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Courses", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.getByRole("button", { name: "Hide answer" })).toBeVisible();
});

test("signed-out web flashcards access redirects to login", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("intellectx:learner-session");
  });

  await page.goto("/flashcards");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Flashcards for focused review" })).toHaveCount(0);
});
