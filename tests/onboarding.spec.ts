import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { initialLearningState, LEARNING_STORAGE_KEY } from "../lib/learning";
import { ONBOARDING_STORAGE_KEY } from "../lib/onboarding";

test.use({ introduction: "new" });

test("a fresh visit teaches the real interactions and remembers completion without awarding XP", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meet the elements.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), ONBOARDING_STORAGE_KEY))
    .toBe("pending");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Meet the elements.", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator(".welcome-image").evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.waitForFunction(() =>
    Boolean((document.querySelector("#gl") as HTMLCanvasElement)?.getContext("webgl2")),
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Make it move." })).toBeFocused();
  await page.getByRole("button", { name: "Next tutorial element" }).click();
  await expect(page.locator(".welcome-demo-label")).toContainText("Fluorine");
  const interaction = page.getByRole("slider");
  const swipe = (await interaction.boundingBox())!;
  await page.mouse.move(swipe.x + swipe.width * 0.3, swipe.y + swipe.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(swipe.x + swipe.width * 0.7, swipe.y + swipe.height * 0.5, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator(".welcome-demo-label")).toContainText("Oxygen");
  await interaction.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".welcome-demo-label")).toContainText("Fluorine");
  await page.getByRole("button", { name: "Rotate mode", exact: true }).click();
  const demo = (await page.locator(".welcome-canvas").boundingBox())!;
  await page.mouse.move(demo.x + demo.width * 0.7, demo.y + demo.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(demo.x + demo.width * 0.3, demo.y + demo.height * 0.4, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator(".welcome-demo-label")).toContainText("Fluorine");
  await page.getByRole("button", { name: "Pause tutorial animation" }).click();
  await expect(page.getByRole("button", { name: "Resume tutorial animation" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Every atom has a story." })).toBeVisible();
  await page.getByRole("button", { name: "Try element details" }).click();
  await expect(page.getByRole("dialog")).toContainText("Fluorine");
  await page.keyboard.press("Escape");
  await page.locator(".welcome-canvas").scrollIntoViewIfNeeded();
  const atom = (await page.locator("#gl").boundingBox())!;
  await page.mouse.click(atom.x + atom.width * 0.5, atom.y + atom.height * 0.4);
  await expect(page.getByRole("dialog")).toContainText("Fluorine");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Keep your curiosity going." })).toBeVisible();
  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#in")).toContainText("Oxygen");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    LEARNING_STORAGE_KEY,
  );
  expect(saved.xp).toBe(120);
  expect(saved.discovered).toHaveLength(12);
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".welcome-page")).toHaveCount(0);
});

test("returning visitors can replay from Settings without changing their progress or theme", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const state = initialLearningState();
  state.settings.theme = "noir";
  state.favorites = [26];
  state.onboardingDismissed = true;
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: LEARNING_STORAGE_KEY, state },
  );
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const before = await page.evaluate((key) => localStorage.getItem(key), LEARNING_STORAGE_KEY);
  await page.locator("#mb").click();
  await page.getByRole("button", { name: "More settings", exact: true }).click();
  await page.getByRole("link", { name: "Replay introduction" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { name: "Meet the elements.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "noir");
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "noir");
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_STORAGE_KEY)).toBe(
    before,
  );
});

test("blocked storage still permits skipping and replaying without a redirect loop", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meet the elements.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#mb").click();
  await page.getByRole("button", { name: "More settings", exact: true }).click();
  await page.getByRole("link", { name: "Replay introduction" }).click();
  await expect(
    page.getByRole("heading", { name: "Meet the elements.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
});

test("all introduction steps remain readable, keyboard accessible and within narrow viewports", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/welcome");
  for (let step = 0; step < 4; step++) {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      audit.violations.map((item) => ({
        rule: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    const forward = page.getByRole("button", {
      name: step === 3 ? "Start exploring" : "Continue",
      exact: true,
    });
    const bounds = (await forward.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(760);
    if (step < 3) await forward.click();
  }
});
