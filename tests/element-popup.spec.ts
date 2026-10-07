import { expect, test, type Page } from "./fixtures";
import { elements } from "../lib/elements";
import { getScience } from "../lib/science";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const hint = page.getByRole("button", { name: "Got it", exact: true });
  if (await hint.isVisible()) await hint.click();
}

test("all 118 symbols are visible without granting unearned discoveries", async ({ page }) => {
  await ready(page);
  await page.locator("#gb").click();
  await expect(page.locator("#tb .c b")).toHaveText(elements.map((element) => element.s));
  await expect(page.locator("#c1")).toHaveText("12 / 118");
  await page.locator('#tb [data-i="117"]').click();
  await expect(page.locator("#in")).toContainText("Oganesson");
  await page.getByRole("button", { name: "Element details", exact: true }).click();
  await expect(page.locator("#dt .lead-copy")).toHaveText(getScience(118).description);
  await expect(page.locator("#dt")).toContainText(getScience(118).everyday);
  expect(await page.locator(".structure-electrons circle").count()).toBe(118);
  expect(
    await page
      .locator(".structure-electrons")
      .evaluateAll((shells) => shells.map((shell) => shell.children.length)),
  ).toEqual(getScience(118).shells);
  await expect(page.locator("#dt .fa b").first()).toHaveCSS("font-family", /JetBrains Mono/);
  await expect(page.locator("#dt .fa b").last()).toHaveCSS("font-family", /Nunito/);
});

test("tapping the orb opens its popup and restores keyboard focus on close", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.getByRole("button", { name: "Pause atom animation", exact: true }).click();
  await page.locator("#app").scrollIntoViewIfNeeded();
  // The nucleus sits above the scene's ground plane, at the visual centre of the orb.
  const box = (await page.locator("#gl").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.4);
  await expect(page.getByRole("dialog", { name: "Element details", exact: true })).toBeVisible();
  await expect(page.locator("#dn")).toHaveText("Oxygen");
  await expect(page.locator("#dt .lead-copy")).toHaveText(getScience(8).description);
  await expect(page.locator("#dt")).toContainText(getScience(8).everyday);
  await page.keyboard.press("Escape");
  await expect(page.locator("#in")).toBeFocused();
  expect(errors).toEqual([]);
});

test("structure animates, pauses without jumping, and respects live reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  await page.getByRole("button", { name: "Element details", exact: true }).click();
  const structure = page.locator(".element-structure");
  const shell = structure.locator(".structure-electrons").first();
  await expect(structure).toHaveAttribute("data-playing", "true");
  await expect
    .poll(() => shell.evaluate((node) => node.getAnimations()[0]?.currentTime))
    .toBeGreaterThan(100);
  await structure.getByRole("button", { name: "Pause structure animation" }).click();
  await expect(structure.locator("button svg")).toHaveCSS("width", "20px");
  await expect(structure.locator("button svg")).toHaveCSS("height", "20px");
  await expect(shell).toHaveCSS("animation-play-state", "paused");
  const pausedTime = await shell.evaluate(async (node) => {
    const animation = node.getAnimations()[0];
    await animation.ready;
    return animation.currentTime;
  });
  await page.waitForTimeout(120);
  expect(await shell.evaluate((node) => node.getAnimations()[0].currentTime)).toBe(pausedTime);
  await structure.getByRole("button", { name: "Resume structure animation" }).click();
  await expect
    .poll(() => shell.evaluate((node) => node.getAnimations()[0]?.currentTime))
    .toBeGreaterThan(Number(pausedTime));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(structure).toHaveAttribute("data-playing", "false");
  await expect(shell).toHaveCSS("animation-name", "none");
  expect(await shell.evaluate((node) => node.getAnimations().length)).toBe(0);
});

test("browser theme colour follows selected themes and the background covers the viewport", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
  for (const [label, color] of [
    ["Midnight", "#0a1028"],
    ["Noir", "#000"],
    ["Dusk", "#232b65"],
    ["Day", "#f0f5fc"],
  ]) {
    await page.locator("#mb").click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect
      .poll(() =>
        page
          .locator('meta[name="theme-color"]')
          .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content"))),
      )
      .toEqual([color, color]);
  }
  for (const target of ["html", "body"]) {
    await expect(page.locator(target)).toHaveCSS("background-attachment", "fixed");
    expect(
      await page.locator(target).evaluate((node) => getComputedStyle(node).backgroundImage),
    ).toContain("gradient");
  }
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
    "content",
    "black-translucent",
  );
});
