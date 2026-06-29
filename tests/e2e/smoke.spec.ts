import { expect, test } from "@playwright/test";

async function seedLearnerAccess(
  page: import("@playwright/test").Page,
  options: { selectedCourses?: boolean; subjectsOrModules?: string[] } = {},
) {
  await page.addInitScript(({ selectedCourses, subjectsOrModules }) => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({
        name: "Playwright Learner",
        email: "playwright.learner@intellectx.local",
        role: "student",
      }),
    );
    window.localStorage.setItem(
      "intellectx:academic-profile",
      JSON.stringify({
        educationLevel: "Senior",
        curriculumOrInstitution: "Botswana curriculum",
        gradeOrYear: "Form 5",
        subjectsOrModules,
      }),
    );

    if (selectedCourses) {
      const selectedAt = Date.now();
      window.localStorage.setItem(
        "intellectx:course-selection",
        JSON.stringify({
          selectedCourseIds: ["ai-study-systems"],
          selectedAt,
          gracePeriodEndsAt: selectedAt + 7 * 24 * 60 * 60 * 1000,
          lockedAt: null,
          locked: false,
        }),
      );
    } else {
      window.localStorage.removeItem("intellectx:course-selection");
    }
  }, { subjectsOrModules: ["AI Productivity"], ...options });
}

async function fillInputWithNativeEvent(page: import("@playwright/test").Page, selector: string, value: string) {
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const input = element as HTMLInputElement;
      const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

      valueSetter?.call(input, nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    value,
  );
}


const coreRoutes = [
  "/",
  "/courses",
  "/dashboard",
  "/progress",
  "/quizzes",
  "/profile",
  "/mobile-study",
  "/mobile-quizzes",
  "/mobile-notes",
  "/mobile-flashcards",
];
const legalRoutes = [
  { route: "/privacy-policy", heading: "Privacy Policy" },
  { route: "/terms-and-conditions", heading: "Terms and Conditions" },
  { route: "/refund-policy", heading: "Refund Policy" },
];

test.describe("core routes", () => {
  for (const route of coreRoutes) {
    test(`${route} loads`, async ({ page }) => {
      if (
        route === "/courses" ||
        route === "/dashboard" ||
        route === "/progress" ||
        route === "/quizzes" ||
        route === "/profile"
      ) {
        await seedLearnerAccess(page, { selectedCourses: route !== "/courses" });
      }

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

  test("custom 404 page loads for a missing route", async ({ page }) => {
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

test("mobile study entry route exposes the limited mobile scope", async ({ page }) => {
  await page.goto("/mobile-study");

  await expect(page.getByRole("heading", { name: "Study essentials for the mobile app" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quizzes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flashcards" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open quizzes" })).toHaveAttribute("href", "/mobile-quizzes");
  await expect(page.getByRole("link", { name: "Open flashcards" })).toHaveAttribute("href", "/mobile-flashcards");
  await expect(page.getByRole("link", { name: "Open notes" })).toHaveCount(0);
});

test("mobile quiz hub loads and exposes quiz links", async ({ page }) => {
  await page.goto("/mobile-quizzes");

  await expect(page.getByRole("heading", { name: "Practice with focused quizzes" })).toBeVisible();
  await expect(page.getByText("AI Study Systems Check")).toBeVisible();
  await expect(page.getByRole("link", { name: /Start quiz/i }).first()).toHaveAttribute(
    "href",
    /\/quiz\/.+/,
  );
});

test("mobile notes and flashcards entry routes load", async ({ page }) => {
  await page.goto("/mobile-notes");
  await expect(page.getByRole("heading", { name: "Notes are part of each lesson" })).toBeVisible();
  await expect(page.getByText("Instructor notes, explanations, examples, and video-attached learning material")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse lessons" })).toHaveAttribute("href", "/courses");
  await expect(page.getByRole("link", { name: "Open lesson notes" })).toHaveCount(0);

  await page.goto("/mobile-flashcards");
  await expect(page.getByRole("heading", { name: "Flashcards from lesson cards" })).toBeVisible();
  await expect(page.getByText("Tutor, not answer machine")).toBeVisible();
  await expect(page.getByText("Card 1 of")).toBeVisible();
  await expect(page.getByRole("link", { name: "Source lesson" })).toHaveAttribute("href", /\/learn\/.+#lesson-flashcards/);
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.getByRole("button", { name: "Hide answer" })).toBeVisible();
});

test("lesson page keeps instructor course content and removes editable student notes", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/learn/prompting-for-learning", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Prompting for Learning", level: 1 })).toBeVisible();
  await expect(page.getByText("A strong learning prompt gives the AI a role")).toBeVisible();
  await expect(page.getByText("Learning loop")).toBeVisible();
  await expect(page.getByPlaceholder("Capture key ideas, questions, and next actions while you learn...")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lesson notes" })).toHaveCount(0);
});

test("quiz flow reaches final results only after the last question and can restart", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
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
  await expect
    .poll(() =>
      page.evaluate(() => {
        const history = JSON.parse(window.localStorage.getItem("intellectx:quiz-attempt-history") ?? "[]");
        return history[0];
      }),
    )
    .toMatchObject({
      quizId: "ai-study-systems-check",
      quizTitle: "AI Study Systems Check",
      totalQuestions: 3,
    });

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Question 1 of")).toBeVisible();
  await expect(page.getByText("Final results")).toHaveCount(0);

  await page.goto("/progress");
  await expect(page.getByText("Recent quiz attempts")).toBeVisible();
  await expect(page.getByText("AI Study Systems Check").first()).toBeVisible();
  await expect(page.getByText(/of 3 correct/).first()).toBeVisible();
});

test("learner session creates, personalizes dashboard and profile, and clears on logout", async ({ page }) => {
  const learnerName = `Playwright Learner ${Date.now()}`;
  const learnerEmail = "playwright.learner@intellectx.local";

  await page.goto("/signup", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Name").fill(learnerName);
  await page.getByLabel("Email").fill(learnerEmail);
  await page.getByLabel("Password").fill("anything");
  await page.getByRole("button", { name: /Continue to study profile/i }).click();

  await page.getByRole("button", { name: "AI Productivity" }).click();
  await page.getByRole("button", { name: "Complete signup" }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session")))
    .toContain(learnerEmail);

  await page.getByRole("button", { name: "Select" }).first().click();
  await page.evaluate(() => window.localStorage.removeItem("intellectx:learner-session"));

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
  await fillInputWithNativeEvent(page, 'input[name="email"]', learnerEmail);
  await fillInputWithNativeEvent(page, 'input[name="password"]', "anything");
  await expect(page.getByLabel("Email")).toHaveValue(learnerEmail);
  await expect(page.getByLabel("Password")).toHaveValue("anything");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/courses$/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session")))
    .toContain(learnerEmail);

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome back, playwright\.learner/i })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session")))
    .toContain(learnerEmail);

  await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "playwright.learner" })).toBeVisible();
  await expect(page.getByText(learnerEmail)).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).first().click();

  await expect(page).toHaveURL("/");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session"))).toBeNull();
});

test("study profile saves and personalizes courses and quizzes", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/profile#study-profile");

  await expect(page.getByText("Study profile", { exact: true })).toBeVisible();
  await page.getByLabel("Academic level").selectOption("Senior");
  await page.getByLabel("Curriculum").selectOption("Botswana curriculum");
  await page.getByLabel("Grade").selectOption("Form 5");
  await page.getByRole("button", { name: "AI Productivity" }).click();
  await page.getByRole("button", { name: "Save study profile" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.goto("/courses");
  await expect(page.getByText("Filtered for Senior / Botswana curriculum / Grade: Form 5 / AI Productivity")).toBeVisible();
  await expect(page.getByText("AI Study Systems").first()).toBeVisible();

  await page.goto("/quizzes");
  await expect(page.getByText("Personalized for your study profile")).toBeVisible();
  await expect(page.getByText("AI Study Systems Check").first()).toBeVisible();
});

test("study profile no-match fallback keeps filtered empty states safe", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true, subjectsOrModules: ["Biology"] });

  await page.goto("/courses");
  await expect(page.getByText("No exact course matches yet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit study profile" }).first()).toHaveAttribute(
    "href",
    "/profile#study-profile",
  );
  await expect(page.getByRole("heading", { name: "All available courses" })).toHaveCount(0);

  await page.goto("/quizzes");
  await expect(page.getByText("No exact quiz matches yet")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All available quizzes" })).toBeVisible();
  await expect(page.getByText("AI Study Systems Check").first()).toBeVisible();
});

test("progress page renders the subject progress chart without runtime errors", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/progress");

  await expect(page.getByRole("heading", { name: "Your learning momentum" })).toBeVisible();
  await expect(page.getByText("Subject progress")).toBeVisible();
  await expect(page.getByRole("img", { name: "Grouped bar chart of subject completion and remaining work" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("progress page shows a safe empty state before local quiz attempts exist", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/progress", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.removeItem("intellectx:quiz-attempt-history"));
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByText("Recent quiz attempts")).toBeVisible();
  await expect(page.getByText("No local quiz attempts yet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a quiz" })).toHaveAttribute("href", "/mobile-quizzes");
});

test("navbar remains fixed and keeps links as direct navigation items", async ({ page }) => {
  await page.goto("/");

  const nav = page.locator("nav:visible").filter({ has: page.getByRole("link", { name: "Signup" }) });
  await expect(nav).toBeVisible();
  await expect(nav).toHaveCSS("position", "fixed");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Features" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "How it works" })).toBeVisible();
  await expect(nav.locator(".rounded-full").filter({ hasText: /Features|How it works|Pricing/ })).toHaveCount(0);
});

test("desktop navbar marks the current section active", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/courses");
  const nav = page.locator("nav:visible").filter({ has: page.getByRole("button", { name: "Logout" }) });
  await expect(nav).toHaveCSS("position", "fixed");
  await expect(nav.getByRole("link", { name: "Courses" })).toHaveAttribute("aria-current", "page");

  await page.goto("/courses/ai-study-systems");
  await expect(nav.getByRole("link", { name: "Courses" })).toHaveAttribute("aria-current", "page");

  await page.goto("/quizzes");
  await expect(nav.getByRole("link", { name: "Quizzes" })).toHaveAttribute("aria-current", "page");

  await page.goto("/quiz/ai-study-systems-check");
  await expect(nav.getByRole("link", { name: "Quizzes" })).toHaveAttribute("aria-current", "page");
});

test("dashboard exposes study shortcuts without hiding web dashboard content", async ({ page }) => {
  await seedLearnerAccess(page, { selectedCourses: true });
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByText("Study shortcuts")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open mobile quizzes" })).toHaveAttribute("href", "/mobile-quizzes");
  await expect(page.locator('a[href="/mobile-notes"]')).toHaveCount(0);
  await expect(page.locator('a[href="/mobile-flashcards"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enrolled courses" })).toBeVisible();
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
      if (route === "/courses" || route === "/quizzes") {
        await seedLearnerAccess(page, { selectedCourses: route !== "/courses" });
      }

      await page.goto(route);

      await expect(page.getByText(text).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("lesson page keeps lesson content and quiz access visible while hiding video on mobile", async ({ page }) => {
    await seedLearnerAccess(page, { selectedCourses: true });
    await page.goto("/learn/prompting-for-learning");

    await expect(page.getByRole("heading", { name: "Prompting for Learning" })).toBeVisible();
    await expect(page.getByText("A strong learning prompt gives the AI a role")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lesson notes" })).toHaveCount(0);
    await expect(page.getByPlaceholder("Capture key ideas, questions, and next actions while you learn...")).toHaveCount(0);
    await expect(page.getByText("Video lesson preview")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Play lesson" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /Related quiz/i })).toHaveAttribute(
      "href",
      "/quiz/ai-study-systems-check",
    );
  });
});







