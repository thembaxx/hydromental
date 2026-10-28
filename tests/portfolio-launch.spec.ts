import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { elements } from "../lib/elements";
import { LEARNING_STORAGE_KEY, PROGRESS_RECOVERY_KEY } from "../lib/learning";

test.describe.configure({ timeout: 60_000 });

// These are learner journeys and destructive-data boundaries, not snapshots of component markup.
test("an empty journal becomes a sourced discovery, completed practice and a portable record", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#pr")).toContainText("0 / 118 · 0 XP");
  await page
    .getByRole("button", {
      name: info.project.name === "desktop" ? /^Element details:/ : "Explore oxygen",
      exact: true,
    })
    .click();
  await expect(page.locator("#dt")).toContainText("In your everyday world");
  await expect(page.locator("#dt")).toContainText("Atomic no.");
  await expect(page.locator("#pr")).toContainText("1 / 118 · 10 XP");
  await page.getByRole("button", { name: "Try a quick quiz", exact: true }).click();
  await expect(page.locator("#qa .opt")).toHaveCount(4);
  const prompt = await page.locator("#qq").innerText();
  const element = elements.find((item) =>
    prompt.startsWith("Which") ? prompt.includes(item.s + "?") : prompt.includes(item.n + "?"),
  )!;
  expect(element.z).toBe(8);
  const answer = prompt.startsWith("Symbol")
    ? element.s
    : prompt.startsWith("Which")
      ? element.n
      : String(element.z);
  await page.locator("#qa").getByRole("button", { name: answer, exact: true }).click();
  await expect(page.locator(".quiz-explanation")).toContainText("Nicely spotted");
  await expect(page.locator("#pr")).toContainText("15 XP");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#pr")).toContainText("1 / 118 · 15 XP");
  await page.getByRole("button", { name: "Open discovery journal", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const backup = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(backup.state.mastery[element.z].correct).toBe(1);
  expect(backup.state.discovered).toEqual([8]);
  expect(backup.state.xp).toBe(15);
  expect(errors).toEqual([]);
});

test("damaged progress is downloadable and reset needs an explicit second action", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await page.evaluate((key) => {
    localStorage.setItem(key, "{broken learner save");
    localStorage.setItem("el", JSON.stringify({ f: [25], x: 70, s: 0 }));
    localStorage.setItem("unrelated.example", "keep");
  }, LEARNING_STORAGE_KEY);
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Earlier save needs review · Open settings" }).click();
  await expect(
    page.getByText("An earlier save could not be fully read", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download earlier save", exact: true }).click();
  expect(await readFile((await (await download).path())!, "utf8")).toBe("{broken learner save");
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_RECOVERY_KEY)).toBe(
    "{broken learner save",
  );
  await page.getByRole("button", { name: "Reset learning data…", exact: true }).click();
  await page.getByRole("button", { name: "Keep my data", exact: true }).click();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).xp, LEARNING_STORAGE_KEY),
  ).toBe(70);
  await page.getByRole("button", { name: "Reset learning data…", exact: true }).click();
  await page.getByRole("button", { name: "Reset this device", exact: true }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#pr")).toContainText("0 / 118 · 0 XP");
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_RECOVERY_KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("unrelated.example"))).toBe("keep");
});

test("blocked storage and WebGL retain the discovery and backup path", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind === "webgl" || kind === "webgl2" || kind === "experimental-webgl") return null;
      return original.call(this, kind as "2d", ...args);
    } as typeof original;
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip introduction", exact: true }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".elemental-fallback")).toContainText("3D is temporarily unavailable");
  await page.getByRole("button", { name: "Explore oxygen", exact: true }).click();
  await expect(page.locator("#dt")).toContainText("In your everyday world");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Session only · Export to keep progress", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const backup = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(backup.state.discovered).toEqual([8]);
});

test("project help is readable, accessible and fits all target widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A small discovery you can keep.",
  );
  await expect(page.getByRole("link", { name: "Report a problem on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/thembaxx/hydromental/issues/new",
  );
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("a blocked recovery archive keeps both the old save and the session export warning", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await page.evaluate(
    (key) => localStorage.setItem(key, "{unreadable original"),
    LEARNING_STORAGE_KEY,
  );
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error("Quota exceeded");
      original.call(this, name, value);
    };
  }, PROGRESS_RECOVERY_KEY);
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("button", { name: "Earlier save needs review · Open settings" }),
  ).toBeVisible();
  const exportWarning = page.getByRole("button", {
    name: "Session only · Export to keep progress",
    exact: true,
  });
  await expect(exportWarning).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Explore oxygen", exact: true }).click();
  await page.keyboard.press("Escape");
  await exportWarning.click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const backup = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(backup.state.discovered).toEqual([8]);
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_STORAGE_KEY)).toBe(
    "{unreadable original",
  );
});

test("direct details links and the postcard tab both record the element being read", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const panel of ["details", "share"]) {
    await page.goto("/about");
    await page.evaluate((key) => {
      localStorage.removeItem(key);
      localStorage.removeItem("el");
    }, LEARNING_STORAGE_KEY);
    await page.goto(`/?panel=${panel}`);
    await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
    if (panel === "share") {
      await expect(page.locator("#pr")).toContainText("0 / 118 · 0 XP");
      await page.getByRole("tab", { name: "Story & science", exact: true }).click();
    }
    await expect(page.locator("#dt")).toContainText("In your everyday world");
    await expect(page.locator("#pr")).toContainText("1 / 118 · 10 XP");
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).discovered,
        LEARNING_STORAGE_KEY,
      ),
    ).toEqual([8]);
  }
});
