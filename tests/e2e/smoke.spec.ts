import { expect, test } from "@playwright/test";

const coreRoutes = ["/", "/courses", "/dashboard", "/progress", "/quizzes", "/profile"];

test.describe("core routes", () => {
  for (const route of coreRoutes) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);

      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }
});

test("quiz flow reaches final results only after the last question and can restart", async ({ page }) => {
  await page.goto("/quizzes");

  const firstQuizCard = page.locator('a[href="/quiz/ai-study-systems-check"]');
  await expect(firstQuizCard).toBeVisible();
  await firstQuizCard.first().click();
  await expect(page).toHaveURL(/\/quiz\/ai-study-systems-check$/);
  await expect(page.getByText("Final results")).toHaveCount(0);

  for (let step = 0; step < 10; step += 1) {
    const quizCard = page.locator('[data-slot="card"]').filter({ hasText: /Question \d+ of \d+/ });
    const answerChoices = quizCard.locator("button").filter({ hasNotText: /Submit answer|Next question|See results/i });

    await answerChoices.first().click();
    await quizCard.getByRole("button", { name: "Submit answer" }).click();
    await expect(page.getByText("Final results")).toHaveCount(0);

    const seeResults = quizCard.getByRole("button", { name: "See results" });
    if (await seeResults.isVisible()) {
      await seeResults.click();
      break;
    }

    await quizCard.getByRole("button", { name: "Next question" }).click();
  }

  await expect(page.getByText("Final results")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Question 1 of")).toBeVisible();
  await expect(page.getByText("Final results")).toHaveCount(0);
});

test("demo auth creates, persists, and clears a local session", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("learner@intellectx.demo");
  await page.getByLabel("Password").fill("anything");
  await page.getByRole("button", { name: /Continue to dashboard/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("intellectx-demo-session")))
    .toContain("learner@intellectx.demo");

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("intellectx-demo-session")))
    .toContain("learner@intellectx.demo");

  await page.goto("/profile");
  await page.getByRole("button", { name: "Logout" }).first().click();

  await expect(page).toHaveURL("/");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("intellectx-demo-session"))).toBeNull();
});

test("progress page renders the subject progress chart without runtime errors", async ({ page }) => {
  await page.goto("/progress");

  await expect(page.getByRole("heading", { name: "Your learning momentum" })).toBeVisible();
  await expect(page.getByText("Subject progress")).toBeVisible();
  await expect(page.getByRole("img", { name: "Grouped bar chart of subject completion and remaining work" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("navbar remains fixed and keeps links as direct navigation items", async ({ page }) => {
  await page.goto("/");

  const nav = page.locator("nav:visible").filter({ has: page.getByRole("link", { name: "Signup" }) });
  await expect(nav).toBeVisible();
  await expect(nav).toHaveCSS("position", "fixed");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Courses" })).toBeVisible();
  await expect(nav.locator(".rounded-full").filter({ hasText: /Home|Courses|Quizzes|Progress|Dashboard|Pricing|Profile/ })).toHaveCount(0);
});

test("desktop navbar marks the current section active", async ({ page }) => {
  await page.goto("/courses");
  const nav = page.locator("nav:visible").filter({ has: page.getByRole("link", { name: "Signup" }) });
  await expect(nav).toHaveCSS("position", "fixed");
  await expect(nav.getByRole("link", { name: "Courses" })).toHaveAttribute("aria-current", "page");

  await page.goto("/courses/ai-study-systems");
  await expect(nav.getByRole("link", { name: "Courses" })).toHaveAttribute("aria-current", "page");

  await page.goto("/quizzes");
  await expect(nav.getByRole("link", { name: "Quizzes" })).toHaveAttribute("aria-current", "page");

  await page.goto("/quiz/ai-study-systems-check");
  await expect(nav.getByRole("link", { name: "Quizzes" })).toHaveAttribute("aria-current", "page");
});
