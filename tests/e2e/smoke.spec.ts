import { expect, test } from "@playwright/test";


async function seedLearnerAccess(
  page: import("@playwright/test").Page,
  options: { subjectsOrModules?: string[]; includeProfile?: boolean; resetCourseSelection?: boolean } = {},
) {
  const {
    subjectsOrModules = ["AI Productivity"],
    includeProfile = true,
    resetCourseSelection = true,
  } = options;

  const learnerEmail = `playwright.learner.${Date.now()}.${Math.random().toString(36).slice(2)}@intellectx.local`;

  await page.addInitScript(
    ({ subjectsOrModules, includeProfile, resetCourseSelection, learnerEmail }) => {
      window.localStorage.setItem(
        "intellectx:learner-session",
        JSON.stringify({
          name: "Playwright Learner",
          email: learnerEmail,
          role: "student",
        }),
      );

      if (includeProfile) {
        window.localStorage.setItem(
          "intellectx:academic-profile",
          JSON.stringify({
            educationLevel: "Senior",
            curriculumOrInstitution: "Botswana curriculum",
            gradeOrYear: "Form 5",
            subjectsOrModules,
          }),
        );
      } else {
        window.localStorage.removeItem("intellectx:academic-profile");
      }

      if (resetCourseSelection) {
        window.localStorage.removeItem("intellectx:course-selection");
      }
    },
    { subjectsOrModules, includeProfile, resetCourseSelection, learnerEmail },
  );
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

async function visibleNav(page: import("@playwright/test").Page) {
  const nav = page.locator("nav").filter({ has: page.locator('[data-slot="navigation-menu"]') });
  await expect(nav).toHaveCount(1);
  return nav;
}

async function expectPublicNav(page: import("@playwright/test").Page) {
  const nav = await visibleNav(page);

  for (const linkName of ["Features", "How it works", "Pricing", "Login", "Signup"]) {
    await expect(nav.getByRole("link", { name: linkName, exact: true })).toBeVisible();
  }

  for (const linkName of ["Courses", "Quizzes", "Progress", "Dashboard", "Profile"]) {
    await expect(nav.getByRole("link", { name: linkName, exact: true })).toHaveCount(0);
  }

  await expect(nav.getByRole("button", { name: "Logout" })).toHaveCount(0);
}

async function expectAppNav(page: import("@playwright/test").Page) {
  const nav = await visibleNav(page);

  for (const linkName of ["Courses", "Quizzes", "Progress", "Dashboard", "Profile"]) {
    await expect(nav.getByRole("link", { name: linkName, exact: true })).toBeVisible();
  }

  await expect(nav.getByRole("button", { name: "Logout" })).toBeVisible();

  for (const linkName of ["Features", "How it works", "Pricing", "Login", "Signup"]) {
    await expect(nav.getByRole("link", { name: linkName, exact: true })).toHaveCount(0);
  }
}

async function expectNoGenericChat(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Chat" })).toHaveCount(0);
  await expect(page.getByPlaceholder(/ask.*ai|ask.*anything|message/i)).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
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
const globalLoadingCompletionRoutes = ["/", "/courses", "/dashboard", "/learn/prompting-for-learning"];
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
        await seedLearnerAccess(page);
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

test("signed-out homepage shows only public nav links", async ({ page }) => {
  await page.goto("/");

  await expectPublicNav(page);
});

test("login establishes the app nav contract", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await fillInputWithNativeEvent(page, 'input[name="email"]', "nav.learner@intellectx.local");
  await fillInputWithNativeEvent(page, 'input[name="password"]', "anything");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/courses$/);
  await expectAppNav(page);
});

test("authenticated app navigation never falls back to signed-out nav links", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/courses", { waitUntil: "domcontentloaded" });
  await expectAppNav(page);

  for (const linkName of ["Quizzes", "Progress", "Dashboard", "Profile"]) {
    const nav = await visibleNav(page);
    await nav.getByRole("link", { name: linkName, exact: true }).click();
    await expectAppNav(page);
  }
});

test.describe("global loading indicator", () => {
  for (const route of globalLoadingCompletionRoutes) {
    test(`${route} does not leave the app loading spinner stuck`, async ({ page }) => {
      if (route !== "/") {
        await seedLearnerAccess(page);
      }

      await page.goto(route);

      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByTestId("app-loading-spinner")).toHaveCount(0);
    });
  }

  test("appears immediately for internal navigation clicks", async ({ page }) => {
    await seedLearnerAccess(page);
    await page.goto("/courses", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("app-loading-spinner")).toHaveCount(0);

    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "/dashboard";
      link.textContent = "Test dashboard navigation";
      link.dataset.testid = "test-dashboard-navigation";
      link.addEventListener("click", (event) => event.preventDefault());
      document.body.append(link);
    });

    await page.getByTestId("test-dashboard-navigation").click();
    await expect(page.getByTestId("app-loading-spinner")).toBeVisible();

    await page.goto("/courses", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("app-loading-spinner")).toHaveCount(0);
  });

  test("does not appear for hash-only homepage anchor clicks", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("app-loading-spinner")).toHaveCount(0);

    await page.getByRole("link", { name: "Features", exact: true }).first().click();

    await expect(page).toHaveURL(/\/#features$/);
    await expect(page.getByTestId("app-loading-spinner")).toHaveCount(0);
  });
});

test("native app restores logged-in learners from home to courses", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({
        name: "Native Learner",
        email: "native.learner@intellectx.local",
        role: "student",
      }),
    );

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

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/courses$/);
  await expectAppNav(page);
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
  await expect(page.getByRole("region", { name: "AI lesson tutor" })).toHaveCount(0);
  await expect(page.getByText("Tutor, not answer machine")).toBeVisible();
  await expect(page.getByText("Card 1 of")).toBeVisible();
  await expect(page.getByRole("link", { name: "Source lesson" })).toHaveAttribute("href", /\/learn\/.+#lesson-flashcards/);
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.getByRole("button", { name: "Hide answer" })).toBeVisible();
});

test("lesson page keeps instructor course content and removes editable student notes", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/learn/prompting-for-learning", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Prompting for Learning", level: 1 })).toBeVisible();
  await expect(page.getByText("A strong learning prompt gives the AI a role")).toBeVisible();
  await expect(page.getByText("Learning loop")).toBeVisible();
  await expect(page.getByRole("region", { name: "AI lesson tutor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get lesson help" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Related quiz/i })).toHaveAttribute(
    "href",
    "/quiz/ai-study-systems-check",
  );
  await expectNoGenericChat(page);
  await page.getByRole("button", { name: "Get lesson help" }).click();
  await expect(page.getByText("Lesson tutor support for Prompting for Learning is not configured yet.")).toBeVisible();
  await expect(page.getByPlaceholder("Capture key ideas, questions, and next actions while you learn...")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lesson notes" })).toHaveCount(0);
});

test("quiz flow reaches final results only after the last question and can restart", async ({ page }) => {
  await seedLearnerAccess(page);
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

test("quiz timer counts down, times out unanswered questions, and resets", async ({ page }) => {
  await page.clock.install();
  await seedLearnerAccess(page);
  await page.goto("/quiz/ai-study-systems-check");

  await expect(page.getByText("Time left: 6:00")).toBeVisible();
  await page.clock.runFor(2000);
  await expect(page.getByText("Time left: 5:58")).toBeVisible();

  await page.clock.runFor(358000);
  await expect(page.getByText("Final results")).toBeVisible();
  await expect(page.getByText("Time expired.")).toBeVisible();
  await expect(page.getByText("You answered 0 of 3 questions correctly.")).toBeVisible();
  await expect(page.getByText("No answer selected")).toHaveCount(3);

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Question 1 of 3")).toBeVisible();
  await expect(page.getByText("Time left: 6:00")).toBeVisible();
  await expect(page.getByText("Final results")).toHaveCount(0);
});

test("learner session creates, personalizes dashboard and profile, and clears on logout", async ({ page }) => {
  test.setTimeout(60_000);

  const learnerName = `Playwright Learner ${Date.now()}`;
  const learnerEmail = "playwright.learner@intellectx.local";

  await page.goto("/signup", { waitUntil: "networkidle" });

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

  await page.goto("/");
  await page.evaluate(() => window.localStorage.removeItem("intellectx:learner-session"));
  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
  await page.getByLabel("Email").fill(learnerEmail);
  await page.getByLabel("Password").fill("anything");
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

  await page.goto("/profile", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "playwright.learner" })).toBeVisible();
  await expect(page.getByText(learnerEmail)).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).first().click();

  await expect(page).toHaveURL("/");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session"))).toBeNull();
});

test("study profile saves and personalizes courses and quizzes", async ({ page }) => {
  await seedLearnerAccess(page);
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
  await expect(page.getByText("Your personalized profile")).toHaveCount(0);
  await expect(page.getByText("Personalized for your study profile")).toHaveCount(0);
  await expect(page.getByText("AI Study Systems Check").first()).toBeVisible();
});

test("study profile no-match fallback keeps filtered empty states safe", async ({ page }) => {
  await seedLearnerAccess(page, { subjectsOrModules: ["Biology"] });

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

test("progress page renders honest local progress state without mock charts", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/progress");

  await expect(page.getByRole("heading", { name: "Your learning momentum" })).toBeVisible();
  await expect(page.getByText("No progress recorded yet")).toBeVisible();
  await expect(page.getByText("Subject progress")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Grouped bar chart of subject completion and remaining work" })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("progress page shows a safe empty state before local quiz attempts exist", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/progress", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.removeItem("intellectx:quiz-attempt-history"));
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByText("Recent quiz attempts")).toBeVisible();
  await expect(page.getByText("No local quiz attempts yet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a quiz" })).toHaveAttribute("href", "/mobile-quizzes");
});

test("progress page does not show mock learner progress before local activity exists", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/progress", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.removeItem("intellectx:course-selection");
    window.localStorage.removeItem("intellectx:quiz-attempt-history");
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByText("No progress recorded yet")).toBeVisible();
  await expect(page.getByText("No selected courses yet")).toBeVisible();
  await expect(page.getByText("68%")).toHaveCount(0);
  await expect(page.getByText("42%")).toHaveCount(0);
  await expect(page.getByText("24%")).toHaveCount(0);
  await expect(page.getByText("Weak areas")).toHaveCount(0);
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
  await seedLearnerAccess(page);
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
  await seedLearnerAccess(page);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "AI lesson tutor" })).toHaveCount(0);
  await expect(page.getByText("Study shortcuts")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open mobile quizzes" })).toHaveAttribute("href", "/mobile-quizzes");
  await expect(page.locator('a[href="/mobile-notes"]')).toHaveCount(0);
  await expect(page.locator('a[href="/mobile-flashcards"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected courses", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enrolled courses" })).toHaveCount(0);
});

test("dashboard does not show mock enrolled courses or fake progress before local activity exists", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.removeItem("intellectx:course-selection");
    window.localStorage.removeItem("intellectx:quiz-attempt-history");
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByText("No selected courses yet")).toBeVisible();
  await expect(page.getByText("No lessons recorded")).toBeVisible();
  await expect(page.getByText("No attempts yet")).toBeVisible();
  await expect(page.getByText("Memory Systems")).toHaveCount(0);
  await expect(page.getByText("Source Quality")).toHaveCount(0);
  await expect(page.getByText("Diagnostic Review")).toHaveCount(0);
  await expect(page.getByText("68%")).toHaveCount(0);
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
        await seedLearnerAccess(page);
      }

      await page.goto(route);

      await expect(page.getByText(text).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("lesson page keeps lesson content and quiz access visible while hiding video on mobile", async ({ page }) => {
    await seedLearnerAccess(page);
    await page.goto("/learn/prompting-for-learning");

    await expect(page.getByRole("heading", { name: "Prompting for Learning" })).toBeVisible();
    await expect(page.getByText("A strong learning prompt gives the AI a role")).toBeVisible();
    await expect(page.getByRole("region", { name: "AI lesson tutor" })).toBeVisible();
    await expectNoGenericChat(page);
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

test("login does not force study profile setup", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.removeItem("intellectx:learner-session");
    window.localStorage.removeItem("intellectx:academic-profile");
  });

  await fillInputWithNativeEvent(page, 'input[name="email"]', "returning.learner@intellectx.local");
  await fillInputWithNativeEvent(page, 'input[name="password"]', "anything");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/courses$/);
  await expect(page.getByRole("heading", { name: /Choose your next intelligent learning path/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete signup" })).toHaveCount(0);
});

test("forgot password returns to login without creating a learner session", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("intellectx:learner-session");
  });

  await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Return to login" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("intellectx:learner-session"))).toBeNull();
});

test("authenticated nav reaches quizzes and progress without course selection", async ({ page }) => {
  await seedLearnerAccess(page, { includeProfile: false });

  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: /Choose your next intelligent learning path/i })).toBeVisible();

  await page.getByRole("link", { name: "Quizzes" }).click();
  await expect(page).toHaveURL(/\/quizzes$/);
  await expect(page.getByRole("heading", { name: /Practice where learning becomes visible/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "AI lesson tutor" })).toHaveCount(0);

  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole("heading", { name: "Your learning momentum" })).toBeVisible();
});


test("courses page keeps course selection in filters, not under course cards", async ({ page }) => {
  await seedLearnerAccess(page, { resetCourseSelection: false });

  await page.goto("/courses");
  const filters = page.getByRole("region", { name: "Course filters" });

  await expect(page.getByText("Choose up to 5 courses.")).toBeVisible();
  await expect(page.getByText("7-day grace period")).toBeVisible();
  await expect(filters).toBeVisible();
  await expect(filters.getByText(/0 \/ \d selected/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Select" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Locked" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add to plan" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "In your plan" })).toHaveCount(0);

  await filters.getByRole("button").first().click();
  await expect(filters.getByText(/1 \/ \d selected/)).toBeVisible();
});

test("selected courses appear on progress after choosing from course filters", async ({ page }) => {
  await seedLearnerAccess(page, { resetCourseSelection: false });

  await page.goto("/courses");
  const filters = page.getByRole("region", { name: "Course filters" });
  const firstCourseFilter = filters.getByRole("button").first();
  const selectedCourseName = (await firstCourseFilter.textContent())?.trim();

  if (!selectedCourseName) {
    throw new Error("Expected a selectable course filter.");
  }

  await firstCourseFilter.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const storedSelection = window.localStorage.getItem("intellectx:course-selection");
        return storedSelection ? JSON.parse(storedSelection).selectedCourseIds.length : 0;
      }),
    )
    .toBe(1);

  await page.goto("/progress", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Selected courses").first()).toBeVisible();
  await expect(page.getByText(selectedCourseName).first()).toBeVisible();
  await expect(page.getByText("No selected courses yet")).toHaveCount(0);
});

test("completing a quiz updates history and quizzes page reflects the attempt", async ({ page }) => {
  await seedLearnerAccess(page);
  await page.goto("/quiz/ai-study-systems-check");

  for (let step = 0; step < 10; step += 1) {
    const quizCard = page.locator('[data-slot="card"]').filter({ hasText: /Question \d+ of \d+/ });
    const answerChoices = quizCard.locator("button").filter({ hasNotText: /Submit answer|Next question|See results/i });

    await answerChoices.first().click();
    await quizCard.getByRole("button", { name: "Submit answer" }).click();

    const seeResults = quizCard.getByRole("button", { name: "See results" });
    if (await seeResults.isVisible()) {
      await seeResults.click();
      break;
    }

    await quizCard.getByRole("button", { name: "Next question" }).click();
  }

  await expect(page.getByText("Final results")).toBeVisible();

  await page.goto("/quizzes");
  const quizCard = page.locator('a[href="/quiz/ai-study-systems-check"]');
  await expect(quizCard.getByText("Completed")).toBeVisible();
  await expect(quizCard.getByText(/Last score:/)).toBeVisible();
  await expect(quizCard.getByText(/No attempt yet/)).toHaveCount(0);
});

const signedOutLearnerRoutes = ["/courses", "/quizzes", "/progress", "/dashboard", "/profile"];

for (const route of signedOutLearnerRoutes) {
  test(`signed out ${route} redirects to login`, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("intellectx:learner-session");
      window.localStorage.removeItem("intellectx:academic-profile");
    });

    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Logout" })).toHaveCount(0);
  });
}

test("signed out dashboard is guarded when no learner session exists and redirects to login", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("intellectx:learner-session");
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Logout" })).toHaveCount(0);
});

test("pricing keeps premium plan unavailable for free MVP", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByText("Scholar")).toBeVisible();
  await expect(page.getByText("Not live yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Coming Soon" })).toBeDisabled();
});

test("checkout is disabled unless payments are explicitly enabled", async ({ page }) => {
  await page.goto("/checkout?price_id=pri_fake_test");

  await expect(page.getByRole("heading", { name: "Premium checkout is not live yet" })).toBeVisible();
  await expect(page.getByText("Start learning for free while premium account access is being finalized.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free" })).toBeVisible();
});
