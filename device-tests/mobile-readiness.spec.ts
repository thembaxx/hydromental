import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("elementals.onboarding.v1", "done"));
});
test("scientific reference and isotope table work on a touch screen without page overflow", async ({
  page,
}) => {
  await page.goto("/elements/lithium");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lithium");
  await expect(page.getByText("[6.938, 6.997]", { exact: true }).first()).toBeVisible();
  await page.getByText(/Explore \d+ isotopes of Li/).tap();
  await expect(
    page.getByRole("table", { name: "Evaluated ground-state isotopes of Li" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
test("privacy choice is usable by touch and defaults to no measurement", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_vercel/")) requests.push(request.url());
  });
  await page.goto("/privacy");
  const choice = page.getByRole("checkbox", {
    name: "Share anonymous usage and performance statistics",
  });
  await expect(choice).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "Privacy and measurement" })).toBeVisible();
  expect(requests).toEqual([]);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 780 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
test("mobile explorer retains details and navigation with WebGL or its readable fallback", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const intro = page.getByRole("button", { name: "Skip introduction", exact: true });
  if (await intro.isVisible()) await intro.tap();
  await page.getByRole("button", { name: "Element details", exact: true }).tap();
  await expect(page.getByRole("dialog", { name: "Element details", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scientific reference" })).toBeVisible();
});
