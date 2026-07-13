import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("intellectx:learner-session");
  });
});

test("public course entry calls to action require signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/signup");
  await page.getByRole("button", { name: "Can I browse courses without signing in?" }).click();
  await expect(page.getByText("No. Create or sign in to your learner account")).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/signup");
});

test("direct signed-out course access still redirects to login", async ({ page }) => {
  await page.goto("/courses");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Choose your next intelligent learning path/i })).toHaveCount(0);
});
