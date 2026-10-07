import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "./fixtures";
import { initialLearningState, LEARNING_STORAGE_KEY, learningDate } from "../lib/learning";
import { getScience } from "../lib/science";

async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
}
async function journal(page: Page) {
  await page.getByRole("button", { name: "Open discovery journal" }).click();
  await expect(page.getByRole("dialog", { name: "Your discovery journal" })).toBeVisible();
}
async function closePanel(page: Page) {
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), LEARNING_STORAGE_KEY);
}

// These workflows exercise real controls and storage rather than mirroring component internals.
test("favorites, journal rewards, and validated progress transfers survive reloads", async ({
  page,
}) => {
  const seed = initialLearningState();
  seed.onboardingDismissed = true;
  seed.discovered = [...seed.discovered, 13, 14, 15];
  seed.daily[learningDate()] = { discovered: [13, 14, 15], correct: [], reviewed: [], claimed: [] };
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    },
    { key: LEARNING_STORAGE_KEY, value: seed },
  );
  await ready(page);
  await page.getByRole("button", { name: "Favorite Oxygen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove Oxygen from favorites" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("button", { name: "Remove Oxygen from favorites" })).toBeVisible();
  await journal(page);
  const favorites = page
    .getByRole("heading", { name: "Your favorites", exact: true })
    .locator("..");
  await expect(favorites.getByRole("button", { name: "O · Oxygen", exact: true })).toBeVisible();
  const mission = page
    .getByRole("heading", { name: "Three new discoveries", exact: true })
    .locator("..");
  const before = await stored(page);
  await mission.getByRole("button", { name: "Claim reward", exact: true }).click();
  await expect(mission.getByRole("button", { name: "Reward claimed", exact: true })).toBeDisabled();
  await expect.poll(async () => (await stored(page)).xp).toBe(before.xp + 30);
  await closePanel(page);
  await journal(page);
  await expect(
    page
      .getByRole("heading", { name: "Three new discoveries", exact: true })
      .locator("..")
      .getByRole("button", { name: "Reward claimed" }),
  ).toBeDisabled();
  expect((await stored(page)).xp).toBe(before.xp + 30);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("elementals-progress.json");
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.format).toBe("elementals-progress");
  expect(exported.state.version).toBe(2);
  expect(exported.state.favorites).toContain(8);
  await page.locator("#progress-import").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(/valid|JSON|format/i);
  expect((await stored(page)).favorites).toContain(8);
  const restored = { ...exported, state: { ...exported.state, favorites: [26], xp: 500 } };
  await page.locator("#progress-import").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(restored)),
  });
  await expect(favorites.getByRole("button", { name: "Fe · Iron", exact: true })).toBeVisible();
  await expect.poll(async () => (await stored(page)).xp).toBe(500);
  await closePanel(page);
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  expect((await stored(page)).favorites).toEqual([26]);
});

test("comparison search updates sourced properties and playground controls change its model", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Compare elements", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Compare elements" });
  await expect(dialog.getByRole("table")).toHaveAccessibleName("Properties of Oxygen and Sulfur");
  await dialog.locator("#compare-search").fill("sodum");
  await dialog.getByRole("button", { name: "Na · Sodium · 11", exact: true }).click();
  await expect(dialog.getByRole("table")).toHaveAccessibleName("Properties of Oxygen and Sodium");
  const configuration = dialog.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Electron configuration", exact: true }),
  });
  await expect(configuration.getByRole("cell").nth(1)).toHaveText(getScience(11).configuration);
  const density = getScience(11).properties.find((item) => item.label === "Density")!;
  await expect(
    dialog
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: "Density", exact: true }) })
      .getByRole("cell")
      .nth(1),
  ).toContainText(density.value);
  await expect(
    dialog.getByRole("link", { name: "Sodium: story, data, and sources" }),
  ).toHaveAttribute("href", "/elements/sodium");
  await closePanel(page);
  await page.getByRole("button", { name: "Open bonding playground" }).click();
  const sandbox = page.getByRole("dialog", { name: "Bonding playground" });
  await expect(sandbox.getByRole("img")).toHaveAccessibleName(/separated element symbols/);
  await sandbox.getByRole("button", { name: "Connect symbols", exact: true }).click();
  await expect(sandbox.getByRole("img")).toHaveAccessibleName(/connected element symbols/);
  await expect(sandbox.locator("svg[role=img] line")).not.toHaveCount(0);
  await sandbox.getByRole("button", { name: "Reset illustration", exact: true }).click();
  await expect(sandbox.getByRole("img")).toHaveAccessibleName(/separated element symbols/);
  await expect(sandbox.locator("svg[role=img] line")).toHaveCount(0);
  await sandbox.locator("#sandbox-recipe").selectOption("salt");
  await expect(sandbox.locator(".sandbox-formula")).toContainText("NaCl");
  await sandbox.getByRole("button", { name: "Na · Sodium", exact: true }).click();
  await expect(sandbox.getByRole("button", { name: "Na · Sodium", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await sandbox.getByRole("button", { name: "Explore Sodium", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#in")).toContainText("Sodium");
});

test("postcards download valid attributed SVG and share a canonical element link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (window as unknown as { sharedData: ShareData }).sharedData = data;
      },
    });
  });
  await ready(page);
  await page.getByRole("button", { name: "Share element", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Your elemental postcard" });
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download card", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("elementals-oxygen.svg");
  const svg = await readFile((await download.path())!, "utf8");
  expect(svg).toContain("Oxygen");
  expect(svg).toContain("PubChem / Royal Society of Chemistry");
  const valid = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "image/svg+xml");
    return (
      document.documentElement.localName === "svg" && document.querySelector("parsererror") === null
    );
  }, svg);
  expect(valid).toBe(true);
  await dialog.getByRole("button", { name: "Share element", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveText("Element shared.");
  const shared = await page.evaluate(
    () => (window as unknown as { sharedData: ShareData }).sharedData,
  );
  expect(shared.url).toBe("http://127.0.0.1:3000/elements/oxygen");
});

test("appearance, quality, audio and model preferences persist without autoplay", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const instrumented = window as unknown as { audioStarts: number };
    instrumented.audioStarts = 0;
    const original = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (when) {
      instrumented.audioStarts += 1;
      return original.call(this, when);
    };
  });
  await ready(page);
  expect(
    await page.evaluate(() => (window as unknown as { audioStarts: number }).audioStarts),
  ).toBe(0);
  await page.getByRole("button", { name: "Theme and more", exact: true }).click();
  await page.getByRole("button", { name: "More settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Make it yours" });
  await dialog.locator("#settings-theme").selectOption("dusk");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  await dialog.locator("#settings-quality").selectOption("low");
  await dialog.locator("#settings-model").selectOption("scientific");
  await dialog.getByLabel("Show shell labels", { exact: true }).check();
  await dialog.getByLabel("Gentle interaction sounds", { exact: true }).check();
  await dialog.getByLabel("Ambient exploration audio", { exact: true }).check();
  await expect.poll(async () => (await stored(page)).settings.ambient).toBe(true);
  expect(
    await page.evaluate(() => (window as unknown as { audioStarts: number }).audioStarts),
  ).toBeGreaterThan(0);
  await closePanel(page);
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  expect(
    await page.evaluate(() => (window as unknown as { audioStarts: number }).audioStarts),
  ).toBe(0);
  await page.getByRole("button", { name: "Theme and more", exact: true }).click();
  await page.getByRole("button", { name: "More settings", exact: true }).click();
  await expect(dialog.locator("#settings-quality")).toHaveValue("low");
  await expect(dialog.locator("#settings-model")).toHaveValue("scientific");
  await expect(dialog.getByLabel("Show shell labels", { exact: true })).toBeChecked();
  await expect(dialog.getByLabel("Gentle interaction sounds", { exact: true })).toBeChecked();
  await expect(dialog.getByLabel("Ambient exploration audio", { exact: true })).toBeChecked();
});
