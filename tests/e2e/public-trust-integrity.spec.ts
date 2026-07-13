import { expect, test } from "@playwright/test";

test("public homepage uses product capabilities instead of unsupported social proof", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Built for focused study habits and clearer next steps")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Built for clearer next moves" })).toBeVisible();

  for (const unsupportedClaim of [
    "42,000",
    "4.9",
    "18k created",
    "120+",
    "Giana Herwitz",
    "Hanna Gouse",
    "Kaiya Donin",
    "Alex Bergwijn",
  ]) {
    await expect(page.getByText(unsupportedClaim, { exact: true })).toHaveCount(0);
  }

  for (const capability of ["Learn with context", "Test understanding", "See honest progress", "Ask for focused help"]) {
    await expect(page.getByRole("heading", { name: capability })).toBeVisible();
  }
});
