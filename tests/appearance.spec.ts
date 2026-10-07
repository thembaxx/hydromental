import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("Noir persists through reloads and keeps dialogs and reference reading accessible", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#mb").click();
  await page.getByRole("button", { name: "Noir", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "noir");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await page.getByRole("button", { name: "Element details", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Oxygen");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.goto("/elements/oxygen");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "noir");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
});

test("learning tips retire without moving controls, and new interaction modes teach again", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#hint")).toHaveCSS("opacity", "1");
  await expect(page.locator(".model-caption")).toHaveCSS("opacity", "1");
  await page.evaluate(() => document.fonts.ready);
  const identity = await page.locator("#in").boundingBox();
  await page.clock.fastForward(9000);
  await expect(page.locator("#hint")).toHaveCSS("opacity", "0");
  await expect(page.locator(".model-caption")).toHaveCSS("opacity", "0");
  expect(await page.locator("#in").boundingBox()).toEqual(identity);
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(page.locator("#hint")).toContainText("Drag to rotate");
  await expect(page.locator("#hint")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Switch to scientific model" }).click();
  await expect(page.locator(".model-caption")).toContainText("Not to scale");
  await expect(page.locator(".model-caption")).toHaveCSS("opacity", "1");
  await expect(page.locator("#ab")).toHaveText("");
  await page.getByRole("button", { name: "Spread electrons", exact: true }).click();
  await expect(page.locator("#ab")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".brand-link small")).toHaveCount(0);
  await page.getByRole("button", { name: "Exploration help", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Swipe");
});

test("the icon dock follows the selected destination and restores focus after dismissal", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const journal = page.getByRole("button", {
    name: "Open discovery journal",
    exact: true,
    includeHidden: true,
  });
  const compare = page.getByRole("button", {
    name: "Compare elements",
    exact: true,
    includeHidden: true,
  });
  for (const opener of [journal, compare]) {
    await opener.click();
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    const button = await opener.boundingBox();
    await expect
      .poll(async () =>
        Math.abs((await page.locator(".dock-selection").boundingBox())!.x - button!.x),
      )
      .toBeLessThan(1);
    const pill = await page.locator(".dock-selection").boundingBox();
    expect(Math.abs(pill!.width - button!.width)).toBeLessThan(1);
    await expect(opener).toHaveText("");
  }
  await expect(journal).toHaveAttribute("data-active", "false");
  await expect(compare).toHaveAttribute("data-active", "true");
  // A live OS preference change must stop the spring motion too.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await journal.click();
  await page.keyboard.press("Escape");
  await expect(journal).toBeFocused();
  await expect(page.locator(".dock-icon").first()).toHaveCSS("transform", "none");
});
