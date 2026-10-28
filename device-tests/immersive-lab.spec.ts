import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("elementals.onboarding.v1", "done"));
});

test("the full atom viewer remains usable by touch in portrait and landscape", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements/oxygen");
  await page.getByRole("button", { name: "Expand Oxygen atom in fullscreen", exact: true }).tap();
  const dialog = page.getByRole("dialog", { name: "Oxygen fullscreen atom", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Zoom atom in", exact: true }).tap();
  await expect(dialog.locator("output")).toHaveText("115%");
  await dialog.getByRole("button", { name: "Spread electron shells", exact: true }).tap();
  await expect(
    dialog.getByRole("button", { name: "Spread electron shells", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => dialog.boundingBox()).toEqual({ x: 0, y: 0, width: 844, height: 390 });
  await dialog.getByRole("button", { name: "Close fullscreen atom", exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test("the lab categories and model controls work at a narrow touch viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/playground");
  await page.getByRole("button", { name: "Build in 3D", exact: true }).tap();
  await expect(page.locator(".playground-game-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Play Molecule Builder", exact: true }).tap();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Molecule Builder");
  await page.getByRole("button", { name: "Zoom in", exact: true }).tap();
  await page.getByRole("button", { name: "Rotate model right", exact: true }).tap();
  await page.getByRole("button", { name: "Select Oxygen", exact: true }).tap();
  await page.getByRole("button", { name: "Place selected atom in position 1", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: "Place selected atom in position 1", exact: true }),
  ).toContainText("O");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
