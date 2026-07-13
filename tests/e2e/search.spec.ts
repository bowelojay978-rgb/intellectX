import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({ name: "Search Learner", email: "search@example.com", role: "student" }),
    );
  });
});

test("authenticated homepage and catalog search use learner-aware routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Continue Learning" })).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("link", { name: "Start Learning" })).toHaveCount(0);

  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search courses, lessons, and quizzes" }).fill("Memory Systems");
  await expect(page.getByRole("link", { name: /Memory Systems/ })).toHaveAttribute("href", "/learn/memory-systems");
});
