import { expect, test } from "@playwright/test";

test("testimonial marquees respect reduced motion and hide duplicated content from assistive technology", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const track = page.getByTestId("infinite-slider-track").first();
  await expect(track).toHaveAttribute("data-reduced-motion", "true");
  await expect(track.locator('[aria-hidden="true"]')).toBeHidden();

  const initialTransform = await track.evaluate((element) => getComputedStyle(element).transform);
  await page.waitForTimeout(250);
  const finalTransform = await track.evaluate((element) => getComputedStyle(element).transform);

  expect(finalTransform).toBe(initialTransform);
});
