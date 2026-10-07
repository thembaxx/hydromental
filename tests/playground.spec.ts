import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";
import {
  LEARNING_STORAGE_KEY,
  exportProgress,
  initialLearningState,
  saveCreation,
} from "../lib/learning";
import { newGameSession } from "../lib/playground";
async function open(page: Page, game: string) {
  await page.goto(`/playground?game=${game}`);
  await expect(page.locator(".playground-page")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Pause animations and timer" }).click();
}
async function solveWater(page: Page) {
  await page.getByRole("button", { name: "Select Oxygen", exact: true }).click();
  await page.getByRole("button", { name: "Place selected atom in position 1" }).click();
  await page.getByRole("button", { name: "Select Hydrogen", exact: true }).click();
  for (const n of [2, 3])
    await page.getByRole("button", { name: `Place selected atom in position ${n}` }).click();
}
async function check(page: Page) {
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".game-result")).toContainText("Solved!");
}

test("molecule building supports keyboard controls, undo, resume, details and SVG creations", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await open(page, "molecule");
  await expect(page.locator(".game-canvas")).toHaveAttribute("data-renderer", "three");
  const oxygen = page.getByRole("button", { name: "Select Oxygen", exact: true });
  await oxygen.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Place selected atom in position 1" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place selected atom in position 1" }),
  ).toContainText("Empty");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Back to game hub" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue Molecule Builder" }).click();
  await expect(
    page.getByRole("button", { name: "Place selected atom in position 1" }),
  ).toContainText("O");
  await solveWater(page);
  await check(page);
  await expect(page.locator(".game-result")).toContainText("+20 XP");
  await page.getByRole("button", { name: "Save creation", exact: true }).click();
  await page.getByLabel("Creation name").fill("My water");
  await page.getByRole("button", { name: "Save to My lab", exact: true }).click();
  await page.getByRole("button", { name: "Back to game hub" }).click();
  await expect(page.getByRole("heading", { name: "My water", exact: true })).toBeVisible();
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export My water as SVG" }).click();
  expect((await exported).suggestedFilename()).toMatch(/\.svg$/);
  await page.reload();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save creation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check answer" })).toHaveCount(0);
});
test("atom workshop distinguishes isotope and ion and timer pauses", async ({ page }) => {
  await open(page, "atom");
  await page.getByLabel("Round", { exact: true }).selectOption("4");
  await page.getByLabel("Protons", { exact: true }).fill("11");
  await page.getByLabel("Neutrons", { exact: true }).fill("12");
  await page.getByLabel("Electrons", { exact: true }).fill("10");
  await expect(page.locator(".game-readout")).toContainText("Sodium");
  await expect(page.locator(".game-readout")).toContainText("+1");
  await page.getByLabel("Optional timer").check();
  await expect
    .poll(async () =>
      Number(
        await page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!).playground.resume.elapsed,
          LEARNING_STORAGE_KEY,
        ),
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause animations and timer" }).click();
  const paused = await page.locator(".game-time").textContent();
  await page.waitForTimeout(1300);
  expect(await page.locator(".game-time").textContent()).toBe(paused);
  await check(page);
  await page.getByRole("button", { name: "Free play", exact: true }).click();
  await page.getByLabel("Protons", { exact: true }).fill("118");
  await expect(page.locator(".game-readout")).toContainText("Oganesson");
  await expect(page.locator(".game-body")).toContainText("not a claim");
});
test("equation balancing and periodic puzzle have real conservation and position clues", async ({
  page,
}) => {
  await open(page, "balance");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator(".game-result")).toContainText("Keep experimenting");
  await page.getByLabel("Coefficient for H₂ reactant").fill("2");
  await page.getByLabel("Coefficient for H₂O product").fill("2");
  await expect(page.getByRole("table")).not.toContainText("Unequal");
  await check(page);
  await open(page, "periodic");
  for (const [name, period, group] of [
    ["Hydrogen", 1, 1],
    ["Helium", 1, 18],
    ["Neon", 2, 18],
    ["Argon", 3, 18],
  ]) {
    await page.getByRole("button", { name: `Select ${name}`, exact: true }).click();
    await page
      .getByRole("button", { name: `Period ${period}, group ${group}`, exact: true })
      .click();
  }
  await check(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test("everyday detective and mystery teach materials and progressive clues", async ({ page }) => {
  await open(page, "detective");
  for (const [part, element] of [
    ["Processor", "Silicon"],
    ["Wiring", "Copper"],
    ["Rechargeable battery", "Lithium"],
    ["Speaker magnet", "Neodymium"],
  ]) {
    await page.getByRole("button", { name: `Inspect ${part}`, exact: true }).click();
    await page.getByRole("button", { name: `Select ${element}`, exact: true }).click();
  }
  await check(page);
  await expect(page.locator(".game-explanations")).toContainText("not contain a lump");
  await open(page, "mystery");
  await expect(page.locator(".game-clues li")).toHaveCount(1);
  await page.getByRole("button", { name: "Reveal hint" }).click();
  await expect(page.locator(".game-clues li")).toHaveCount(2);
  await page.getByLabel("Find your answer").fill("Hydrogen");
  await page.getByLabel("Mystery element", { exact: true }).selectOption("1");
  await check(page);
});
test("crystal builder and property ordering solve with explicit touch alternatives", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await open(page, "crystal");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Add section", exact: true }).click();
  await check(page);
  await expect(page.locator(".game-result")).toContainText("six nearest neighbours");
  await page.getByRole("button", { name: "Next round", exact: false }).click();
  await page.getByRole("button", { name: "Diamond", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Add section", exact: true }).click();
  await check(page);
  await open(page, "properties");
  for (const name of ["Hydrogen", "Carbon"])
    await page.getByRole("button", { name: `Move ${name} earlier` }).click();
  await page.getByRole("button", { name: "Move Carbon earlier" }).click();
  await check(page);
  await expect(page.locator(".property-order")).toContainText("1.008");
  await page.getByRole("button", { name: "Inspect Carbon", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Carbon details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In your everyday world" })).toBeVisible();
  await page.keyboard.press("Escape");
});
test("hub and each game meet accessibility requirements in Noir and narrow layouts", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground");
  await page.getByRole("button", { name: "Playground settings" }).click();
  await page.getByLabel("Appearance", { exact: true }).selectOption("noir");
  await page.getByRole("button", { name: "Close settings" }).click();
  for (const game of [
    "hub",
    "molecule",
    "atom",
    "balance",
    "periodic",
    "detective",
    "mystery",
    "crystal",
    "properties",
  ]) {
    if (game !== "hub") {
      await page.goto(`/playground?game=${game}`);
      await expect(page.locator(".playground-page")).toHaveAttribute("data-ready", "true");
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      game,
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, game).toEqual([]);
  }
});
test("the whole playground works offline after production precaching", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto("/playground");
  await expect(page.locator(".playground-page")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Play Balance It", exact: true }).click();
  await page.getByLabel("Coefficient for H₂ reactant").fill("2");
  await page.getByLabel("Coefficient for H₂O product").fill("2");
  await check(page);
  await context.setOffline(false);
});

test("touch dragging places atoms, camera buttons work and GPU loss preserves the game", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await open(page, "molecule");
    const oxygen = page.getByRole("button", { name: "Select Oxygen", exact: true });
    await oxygen.scrollIntoViewIfNeeded();
    const source = (await oxygen.boundingBox())!;
    const canvas = page.locator(".game-canvas canvas");
    const target = (await canvas.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const from = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const to = { x: target.x + target.width / 2, y: target.y + target.height * 0.4313 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
    for (let step = 1; step <= 6; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: from.x + ((to.x - from.x) * step) / 6, y: from.y + ((to.y - from.y) * step) / 6 },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(
      page.getByRole("button", { name: "Place selected atom in position 1" }),
    ).toContainText("O");
    await page.touchscreen.tap(to.x, to.y);
    await expect(page.getByRole("dialog", { name: "Oxygen details" })).toBeVisible();
    await page.getByRole("button", { name: "Inspect shell 1, 2 electrons", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("status")).toContainText(
      "contains 2 electrons",
    );
    await page.keyboard.press("Escape");
    const before = await canvas.screenshot();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
    await page.getByRole("button", { name: "Rotate model right" }).click();
    await page.getByRole("button", { name: "Reset view" }).click();
    await canvas.evaluate((node) =>
      (node as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
    await expect(page.locator(".game-canvas")).toHaveAttribute("data-renderer", "fallback");
    await expect(page.locator(".game-model-fallback")).toBeVisible();
    await expect(page.locator(".game-model-fallback")).toContainText(
      "All controls and challenges still work",
    );
    await solveWater(page);
    await check(page);
  } finally {
    await context.close();
  }
});

test("playground settings restore creations from a backup and export all progress", async ({
  page,
}) => {
  let state = initialLearningState();
  state.settings.theme = "noir";
  state = saveCreation(state, {
    id: "creation-backup",
    title: "Backup helium",
    at: Date.now(),
    session: { ...newGameSession("atom", 2, true), values: [2, 2, 2] },
  });
  await page.goto("/playground");
  await page.getByRole("button", { name: "Playground settings" }).click();
  await page.getByLabel("Restore a progress backup").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(exportProgress(state)),
  });
  await expect(page.getByRole("heading", { name: "Backup helium", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "noir");
  await page.getByRole("button", { name: "Playground settings" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress backup" }).click();
  expect((await download).suggestedFilename()).toBe("elementals-progress.json");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(page.locator(".game-readout")).toContainText("Helium");
  await expect(page.getByLabel("Protons", { exact: true })).toHaveValue("2");
});

test("material markers have comfortable separation at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page, "detective");
  for (const round of [0, 1, 2]) {
    await page.getByRole("combobox", { name: "Round", exact: true }).selectOption(String(round));
    const boxes = await page.locator(".game-hotspot").evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) {
        const one = boxes[a],
          two = boxes[b];
        expect(
          one.x + one.width <= two.x ||
            two.x + two.width <= one.x ||
            one.y + one.height <= two.y ||
            two.y + two.height <= one.y,
          `round ${round}, markers ${a + 1}/${b + 1}`,
        ).toBe(true);
      }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
