import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "intellectx:learner-session",
      JSON.stringify({ name: "Lesson Learner", email: "lesson@example.com", role: "student" }),
    );
  });
});

test("lesson notes stay on the page canvas and unavailable video controls are honest", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/learn/prompting-for-learning");

  const notes = page.getByRole("region", { name: "Lesson notes" });
  await expect(notes).toBeVisible();
  await expect(notes).toContainText("A strong learning prompt gives the AI a role");

  const videoPreview = page.getByText("Video lesson preview");
  await expect(videoPreview).toBeVisible();
  await expect(videoPreview.locator("..")).toHaveClass(/bg-blue-600/);

  await expect(page.getByRole("button", { name: "Play" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Captions unavailable" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Picture in picture unavailable" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Playback settings" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Fullscreen unavailable" })).toBeDisabled();
});
