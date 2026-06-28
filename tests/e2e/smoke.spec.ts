import { expect, test } from "@playwright/test";

const coreRoutes = ["/", "/courses", "/dashboard", "/progress", "/quizzes", "/profile"];
const legalRoutes = [
  { route: "/privacy-policy", heading: "Privacy Policy" },
  { route: "/terms-and-conditions", heading: "Terms and Conditions" },
  { route: "/refund-policy", heading: "Refund Policy" },
];

test.describe("core routes", () => {
  for (const route of coreRoutes) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);

      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }
});

test.describe("production support routes", () => {
  for (const { route, heading } of legalRoutes) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("Effective date: June 28, 2026")).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }

  test("custom 404 page loads for a fake route", async ({ page }) => {
    const response = await page.goto("/this-route-should-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("main").getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
  });

  test("robots.txt and sitemap.xml load", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText).toContain("User-Agent: *");
    expect(robotsText).toContain("Sitemap: https://intellect-x-coral.vercel.app/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("https://intellect-x-coral.vercel.app/courses");
    expect(sitemapText).toContain("https://intellect-x-coral.vercel.app/quiz/ai-study-systems-check");
  });

  test("low-risk security headers are present", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["permissions-policy"]).toContain("microphone=()");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
  });
});

test("quiz flow reaches final results only after the last question and can restart", async ({ page }) => {
  await page.goto("/quizzes");

  const firstQuizCard = page.locator('a[href="/quiz/ai-study-systems-check"]');
  await expect(firstQuizCard).toBeVisible();
  await expect(firstQuizCard).toHaveAttribute("href", "/quiz/ai-study-systems-check");
  const quizHref = await firstQuizCard.getAttribute("href");
  if (!quizHref) throw new Error("Quiz card href was missing");
  await page.goto(quizHref);
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

test.describe("mobile smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const mobileRoutes = [
    { route: "/", text: "IntellectX" },
    { route: "/courses", text: "Choose your next intelligent learning path" },
    { route: "/quizzes", text: "Practice where learning becomes visible" },
    { route: "/privacy-policy", text: "Privacy Policy" },
  ];

  for (const { route, text } of mobileRoutes) {
    test(`${route} loads on mobile`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByText(text).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }
});
