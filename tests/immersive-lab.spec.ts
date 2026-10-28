import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("fullscreen preserves atom controls, fills the viewport, and restores focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements/oxygen");
  await expect(page.locator(".atom-study-renderer canvas")).toBeVisible();
  await page.getByRole("button", { name: "Zoom atom in", exact: true }).click();
  await expect(page.locator(".atom-study output")).toHaveText("115%");
  const opener = page.getByRole("button", {
    name: "Expand Oxygen atom in fullscreen",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Oxygen fullscreen atom", exact: true });
  await expect(dialog).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(Math.abs(bounds.x) + Math.abs(bounds.y)).toBeLessThan(2);
  expect(Math.abs(bounds.width - viewport.width)).toBeLessThan(2);
  expect(Math.abs(bounds.height - viewport.height)).toBeLessThan(2);
  await expect(dialog.locator("output")).toHaveText("115%");
  const model = dialog.getByRole("application", { name: "Interactive 3D Oxygen atom" });
  await model.focus();
  await model.press("+");
  await expect(dialog.locator("output")).toHaveText("125%");
  await dialog.getByRole("button", { name: "Spread electron shells", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Spread electron shells", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Reset atom view", exact: true }).click();
  await expect(dialog.locator("output")).toHaveText("100%");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("direct rotation works with reduced motion and the renderer really changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements/carbon");
  const canvas = page.locator(".atom-study-renderer canvas");
  await expect(canvas).toHaveAttribute("data-render-state", "on-demand");
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.screenshot();
  const model = page.getByRole("application", { name: "Interactive 3D Carbon atom" });
  await model.focus();
  await model.press("ArrowRight");
  await model.press("ArrowDown");
  await expect(async () => expect(await canvas.screenshot()).not.toEqual(before)).toPass();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-render-state", "active");
  await page.getByRole("button", { name: "Pause atom animation", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-render-state", "on-demand");
});

test("two-finger pinch zooms the full atom without an accidental tap", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements/oxygen");
  await page.getByRole("button", { name: "Expand Oxygen atom in fullscreen", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Oxygen fullscreen atom", exact: true });
  const model = dialog.getByRole("application");
  await expect(model.locator("canvas")).toBeVisible();
  const box = (await model.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const touches = (distance: number) => [
    { x: x - distance, y, id: 1 },
    { x: x + distance, y, id: 2 },
  ];
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(30) });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(47) });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect
    .poll(async () => Number.parseInt(await dialog.locator("output").innerText()))
    .toBeGreaterThan(120);
  await expect(dialog).toBeVisible();
  await client.detach();
});

test("the live lab preview and experiment filters preserve the complete game hub", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground");
  await expect(page.locator(".lab-bench .game-canvas canvas")).toBeVisible();
  await page.getByRole("button", { name: "CO₂ Carbon dioxide", exact: true }).click();
  await expect(page.locator(".lab-bench figcaption strong")).toContainText("Carbon dioxide");
  await page.getByRole("button", { name: "Build in 3D", exact: true }).click();
  await expect(page.locator(".playground-game-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Puzzles & discovery", exact: true }).click();
  await expect(page.locator(".playground-game-card")).toHaveCount(5);
  await page.getByRole("button", { name: "All experiments", exact: true }).click();
  await expect(page.locator(".playground-game-card")).toHaveCount(8);
  await page.getByRole("button", { name: "Start building", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Molecule Builder");
  await expect(page.getByRole("button", { name: "Play challenge", exact: true })).toBeVisible();
  await expect(page.locator(".game-canvas canvas")).toBeVisible();
});

test("the periodic table keeps the current cell in view and supports readable zoom and keyboard travel", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?panel=table");
  const table = page.locator("#tb");
  const oxygen = table.getByRole("button", { name: /Oxygen$/ });
  await expect(oxygen).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      oxygen.evaluate((node) => {
        const item = node.getBoundingClientRect();
        const root = node.parentElement!.getBoundingClientRect();
        return (
          item.left >= root.left &&
          item.right <= root.right &&
          item.top >= root.top &&
          item.bottom <= root.bottom
        );
      }),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Larger table cells", exact: true }).click();
  await expect
    .poll(() => oxygen.evaluate((node) => node.getBoundingClientRect().width))
    .toBeGreaterThan(56);
  await table.evaluate((node) => {
    node.scrollLeft = 0;
  });
  await page.getByRole("button", { name: "Smaller table cells", exact: true }).click();
  await expect.poll(() => table.evaluate((node) => node.scrollLeft)).toBe(0);
  await oxygen.focus();
  await oxygen.press("End");
  await expect(table.getByRole("button", { name: /Oganesson$/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#in h1")).toHaveText("Oganesson");
});

test("the fullscreen atom and redesigned lab pass automated WCAG checks", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements/oxygen");
  await page.getByRole("button", { name: "Expand Oxygen atom in fullscreen", exact: true }).click();
  for (const destination of ["atom", "lab"] as const) {
    if (destination === "lab") await page.goto("/playground");
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
});
