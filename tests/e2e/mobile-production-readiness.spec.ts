import { expect, test } from "@playwright/test";

async function simulateNativeAndroid(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as Window & {
      Capacitor?: {
        isNativePlatform: () => boolean;
        getPlatform: () => string;
      };
    }).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
    };
  });
}

async function seedLocalLearner(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({
        name: "Mobile Learner",
        email: "mobile.learner@intellectx.local",
        role: "student",
      }),
    );
  });
}

test("mobile study keeps quizzes first, flashcards second, and notes out of scope", async ({ page }) => {
  await page.goto("/mobile-study");

  await expect(page.locator("main h2")).toHaveText(["Quizzes", "Flashcards"]);
  await expect(page.getByRole("heading", { name: "Notes" })).toHaveCount(0);

  const mobileNav = page.getByRole("navigation", { name: "Mobile study navigation" });
  await expect(mobileNav.getByRole("link")).toHaveText(["Quizzes", "Flashcards"]);
});

test("mobile quiz detail stays inside the mobile shell", async ({ page }) => {
  await seedLocalLearner(page);
  await page.goto("/mobile-quizzes");

  const startQuiz = page.getByRole("link", { name: /Start quiz/i }).first();
  await expect(startQuiz).toHaveAttribute("href", /\/quiz\/.+\?from=mobile$/);
  await startQuiz.click();

  await expect(page).toHaveURL(/\/quiz\/.+\?from=mobile$/);
  await expect(page.getByText("Free mobile")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile study navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quizzes", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Courses", exact: true })).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
});

test("native direct quiz deep links resolve to the mobile shell", async ({ page }) => {
  await simulateNativeAndroid(page);
  await seedLocalLearner(page);
  await page.goto("/quiz/ai-study-systems-check", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Free mobile")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile study navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quizzes", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Courses", exact: true })).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
});

test("native app redirects web-only routes back to the mobile quiz home", async ({ page }) => {
  await simulateNativeAndroid(page);
  await page.goto("/mobile-notes", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/mobile-quizzes$/);
  await expect(page.getByRole("heading", { name: "Practice with focused quizzes" })).toBeVisible();
});
