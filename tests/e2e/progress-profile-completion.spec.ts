import { expect, test } from "@playwright/test";

const learnerSession = {
  name: "Progress Profile Learner",
  email: "progress-profile@example.com",
  role: "student",
};

const studyProfile = {
  educationLevel: "Senior",
  curriculumOrInstitution: "Botswana curriculum",
  gradeOrYear: "Form 5",
  subjectsOrModules: ["AI Productivity"],
};

const courseSelection = {
  selectedCourseIds: ["ai-study-systems"],
  selectedAt: Date.parse("2026-07-14T08:00:00.000Z"),
  gracePeriodEndsAt: Date.parse("2026-07-21T08:00:00.000Z"),
  lockedAt: null,
  locked: false,
};

const completedLessonHistory = ["prompting-for-learning", "memory-systems", "weekly-review"].map(
  (lessonId, index) => ({
    lessonId,
    status: "completed",
    progress: 100,
    updatedAt: `2026-07-14T0${index + 8}:00:00.000Z`,
  }),
);

const quizHistory = [
  {
    quizId: "ai-study-systems-check",
    quizTitle: "AI Study Systems Check",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    completedAt: "2026-07-14T11:00:00.000Z",
  },
];

async function seedProgressProfileState(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ learnerSession, studyProfile, courseSelection, completedLessonHistory, quizHistory }) => {
      window.localStorage.setItem("intellectx:learner-session", JSON.stringify(learnerSession));
      window.localStorage.setItem("intellectx:academic-profile", JSON.stringify(studyProfile));
      window.localStorage.setItem("intellectx:course-selection", JSON.stringify(courseSelection));
      window.localStorage.setItem("intellectx:lesson-progress-history", JSON.stringify(completedLessonHistory));
      window.localStorage.setItem("intellectx:quiz-attempt-history", JSON.stringify(quizHistory));
    },
    { learnerSession, studyProfile, courseSelection, completedLessonHistory, quizHistory },
  );
}

test("completed selected-course progress stays at 100% across refresh", async ({ page }) => {
  await seedProgressProfileState(page);
  await page.goto("/progress");

  const selectedCourses = page.getByRole("heading", { name: "Selected courses" }).locator("..", { hasText: "AI Study Systems" });
  await expect(page.getByText("AI Study Systems")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();

  await page.reload();

  await expect(page.getByText("AI Study Systems")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(selectedCourses).toBeAttached();
});

test("Profile removes previous private learning activity after local learner data is cleared", async ({ page }) => {
  await seedProgressProfileState(page);
  await page.goto("/profile");

  await expect(page.getByText("AI Study Systems")).toBeVisible();
  await expect(page.getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByText("80%", { exact: true })).toBeVisible();
  await expect(page.getByText("Selected courses: 1", { exact: true })).toBeVisible();

  await page.evaluate(() => {
    for (const key of [
      "intellectx:academic-profile",
      "intellectx:course-selection",
      "intellectx:lesson-progress-history",
      "intellectx:quiz-attempt-history",
      "intellectx:study-activity-summary",
    ]) {
      window.localStorage.removeItem(key);
    }
  });

  await page.reload();

  await expect(page.getByText("No selected courses on this profile")).toBeVisible();
  await expect(page.getByText("No completed lessons yet")).toBeVisible();
  await expect(page.getByText("No attempts yet")).toBeVisible();
  await expect(page.getByText("Selected courses: None yet", { exact: true })).toBeVisible();
  await expect(page.getByText("AI Study Systems")).toHaveCount(0);
  await expect(page.getByText("80%", { exact: true })).toHaveCount(0);
});
