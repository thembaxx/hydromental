import { expect, test } from "@playwright/test";

test("the CAPS physics lab supports narrow touch controls and force diagrams", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/physics");
  await page.getByRole("button", { name: "Step flight forward 0.1 seconds" }).tap();
  await expect(page.locator('[data-physics="height"]')).toContainText("1.91");
  await page.getByRole("button", { name: "Force vectors", exact: true }).tap();
  await expect(page.locator('[data-physics="acceleration"]')).toContainText("4.00");
  await page.getByRole("slider", { name: "Rightward force", exact: true }).press("Home");
  await expect(page.locator('[data-physics="acceleration"]')).toContainText("-2.00");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
