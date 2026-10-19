import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("the physics lab is reachable from the playground and its controls work offline", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground");
  const link = page.getByRole("link", { name: "Open physics lab", exact: true });
  await expect(link).toHaveAttribute("href", "/physics");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await link.click();
  await page.getByRole("button", { name: "Step flight forward 0.1 seconds" }).click();
  await expect(page.locator('[data-physics="height"]')).toContainText("1.91");
  await context.setOffline(false);
});

test("projectile presets, signed results and the timeline match the worked equations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/physics");
  await expect(page.getByRole("button", { name: "Start flight", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Step flight forward 0.1 seconds" }).click();
  await expect(page.locator('[data-physics="height"]')).toContainText("1.91");
  await expect(page.locator('[data-physics="vy"]')).toContainText("18.62");
  const timeline = page.getByRole("slider", { name: "Flight time", exact: true });
  await timeline.focus();
  await timeline.press("End");
  await expect(page.locator('[data-physics="height"]')).toContainText("0.00");
  await expect(page.locator('[data-physics="vy"]')).toContainText("-19.60");
  await page.getByRole("button", { name: "Drop from a height", exact: true }).click();
  await expect(page.locator('[data-physics="height"]')).toContainText("19.60");
  await expect(page.locator('[data-physics="vy"]')).toContainText("0.00");
  await page.getByRole("button", { name: "Vector components", exact: true }).click();
  await expect(page.locator('[data-physics="vx"]')).toContainText("14.14");
  await timeline.focus();
  await timeline.press("End");
  await expect(page.locator('[data-physics="distance"]')).toContainText("40.82");
});

test("force vectors teach signed acceleration and balanced forces with real keyboard controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/physics");
  await page.getByRole("button", { name: "Force vectors", exact: true }).click();
  await expect(page.locator('[data-physics="net"]')).toContainText("20.00");
  await expect(page.locator('[data-physics="acceleration"]')).toContainText("4.00");
  const right = page.getByRole("slider", { name: "Rightward force", exact: true });
  await right.focus();
  await right.press("Home");
  await expect(page.locator('[data-physics="acceleration"]')).toContainText("-2.00");
  const left = page.getByRole("slider", { name: "Leftward force", exact: true });
  await left.focus();
  await left.press("Home");
  await expect(page.getByRole("status").filter({ hasText: "Balanced forces" })).toContainText(
    "constant velocity",
  );
  const mass = page.getByRole("slider", { name: "Block mass", exact: true });
  await mass.focus();
  await mass.press("End");
  await right.focus();
  await right.press("End");
  await expect(page.locator('[data-physics="acceleration"]')).toContainText("5.00");
});

test("the R3F scene changes with the experiment and playback pauses without losing time", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/physics");
  const canvas = page.locator(".physics-canvas canvas");
  await expect(canvas).toHaveAttribute("data-render-state", "on-demand");
  const before = await canvas.screenshot();
  await page.getByRole("button", { name: "Step flight forward 0.1 seconds" }).click();
  await expect(async () => expect(await canvas.screenshot()).not.toEqual(before)).toPass();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Start flight", exact: true }).click();
  const timeline = page.getByRole("slider", { name: "Flight time", exact: true });
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0.2);
  await page.getByRole("button", { name: "Pause flight", exact: true }).click();
  const paused = await timeline.inputValue();
  await page.waitForTimeout(200);
  expect(await timeline.inputValue()).toBe(paused);
  await page.getByRole("button", { name: "Reset time", exact: true }).click();
  await expect(timeline).toHaveValue("0");
});

test("physics controls work at 320px, pass WCAG scans and remain readable without WebGL", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/physics");
  for (const mode of ["Projectile motion", "Force vectors"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
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
  await page
    .locator(".physics-canvas canvas")
    .evaluate((node) =>
      (node as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
  await expect(page.getByRole("status").filter({ hasText: "3D is unavailable" })).toBeVisible();
  await page.getByRole("slider", { name: "Rightward force", exact: true }).press("End");
  await expect(page.locator('[data-physics="net"]')).toContainText("90.00");
});
