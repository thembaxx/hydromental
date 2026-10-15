import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";
import { LEARNING_STORAGE_KEY } from "../lib/learning";

async function ready(page: Page, url = "/") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
}

test("one library preserves search and family filters across views and story navigation", async ({
  page,
}) => {
  await ready(page);
  const opener = page.getByRole("button", { name: "Search elements", exact: true });
  await opener.click();
  const library = page.getByRole("dialog", { name: "Element library" });
  await library.getByLabel("Element family", { exact: true }).selectOption("g");
  await page.locator("#si").fill("Neon");
  await library.getByRole("tab", { name: "Families", exact: true }).click();
  await expect(library.getByRole("button", { name: "Show Neon on the stage" })).toBeVisible();
  await expect(library.getByRole("button", { name: "Show Helium on the stage" })).toHaveCount(0);
  await library.getByRole("button", { name: "Favorite Neon", exact: true }).click();
  await library.getByRole("tab", { name: "Periodic table", exact: true }).click();
  await expect(library.locator("#tb .c")).toHaveCount(118);
  await expect(library.locator("#tb .c:enabled")).toHaveCount(1);
  await expect(library.getByRole("button", { name: "Neon", exact: true })).toBeEnabled();
  await expect(library.getByRole("button", { name: "Helium", exact: true })).toBeDisabled();
  await library.getByRole("tab", { name: "Families", exact: true }).click();
  await library.getByRole("button", { name: "Story", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Element details" });
  await expect(details.getByRole("heading", { name: "Neon", exact: true })).toBeVisible();
  await details.getByRole("tab", { name: "Postcard", exact: true }).click();
  await expect(details.getByRole("button", { name: "Download card" })).toBeVisible();
  await page.goBack();
  await expect(library).toBeVisible();
  await expect(page.locator("#si")).toHaveValue("Neon");
  await expect(library.getByLabel("Element family", { exact: true })).toHaveValue("g");
  await expect(library.getByRole("button", { name: "Remove Neon from favorites" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/element=Ne/);
  await expect(page).not.toHaveURL(/panel=/);
  await expect(opener).toBeFocused();
  await page.reload();
  await expect(page.locator("#in h1")).toHaveText("Neon");
});

test("Lab tabs retain comparison and bonding work without opening another dialog", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Open experiment lab", exact: true }).click();
  const lab = page.getByRole("dialog", { name: "Experiment lab" });
  await lab.locator("#compare-search").fill("sodum");
  await lab.getByRole("button", { name: "Na · Sodium · 11", exact: true }).click();
  await lab.getByRole("tab", { name: "Bonding", exact: true }).click();
  await lab.locator("#sandbox-recipe").selectOption("salt");
  await lab.getByRole("button", { name: "Connect symbols", exact: true }).click();
  await lab.getByRole("tab", { name: "Compare", exact: true }).click();
  await expect(lab.getByRole("table")).toHaveAccessibleName("Properties of Oxygen and Sodium");
  await lab.getByRole("tab", { name: "Bonding", exact: true }).click();
  await expect(lab.locator("#sandbox-recipe")).toHaveValue("salt");
  await expect(lab.getByRole("img")).toHaveAccessibleName(/connected element symbols/);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward();
  await expect(lab).toBeVisible();
  await expect(lab.getByRole("tab", { name: "Bonding", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("practice returns to the journal and changing quiz modes resets the answer lock", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Open discovery journal", exact: true }).click();
  const journal = page.getByRole("dialog", { name: "Your discovery journal" });
  await journal.getByRole("tab", { name: "Practice", exact: true }).click();
  await page.locator("#qa .opt").first().click();
  await journal.getByRole("button", { name: "Everyday clues", exact: true }).click();
  await expect(page.locator("#qa .opt.ok, #qa .opt.no")).toHaveCount(0);
  await page.locator("#qa .opt").first().click();
  await expect(page.locator("#qa .opt.ok")).toHaveCount(1);
  const xp = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).xp,
    LEARNING_STORAGE_KEY,
  );
  await journal.getByRole("button", { name: "Back to journal", exact: true }).click();
  await expect(journal.getByRole("tab", { name: "Journal", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(journal.getByRole("button", { name: "Export progress", exact: true })).toBeVisible();
  await expect(page.locator("#qz")).toHaveCount(0);
  await page.waitForTimeout(2700);
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).xp, LEARNING_STORAGE_KEY),
  ).toBe(xp);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("deep-linked panels, keyboard tabs and narrow layouts remain accessible", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 640 });
  await ready(page, "/?element=Au&panel=search");
  const library = page.getByRole("dialog", { name: "Element library" });
  const search = library.getByRole("tab", { name: "Search", exact: true });
  await search.focus();
  await search.press("ArrowRight");
  await expect(library.getByRole("tab", { name: "Families", exact: true })).toBeFocused();
  for (const view of ["Search", "Families", "Periodic table"]) {
    await library.getByRole("tab", { name: view, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await library.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await library
        .locator('.workspace-view[data-state="active"]')
        .evaluate((node) => node.getAnimations().length),
    ).toBe(0);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/element=Au/);
  await expect(page).not.toHaveURL(/panel=/);
});

test("game navigation uses browser history and shares the explorer destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground");
  await page.getByRole("button", { name: "Play Atom Workshop", exact: true }).click();
  await expect(page).toHaveURL(/game=atom/);
  await expect(page.getByRole("heading", { name: "Atom Workshop", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Choose your next experiment" })).toBeVisible();
  await expect(page).not.toHaveURL(/game=/);
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Atom Workshop", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to game hub", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose your next experiment" })).toBeVisible();
  await page.getByRole("button", { name: "Open discovery journal", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Your discovery journal" })).toBeVisible();
});

test("a downward sheet gesture dismisses the panel and restores its opener", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const opener = page.getByRole("button", { name: "Open discovery journal", exact: true });
  await opener.click();
  const handle = page.locator(".sheet-drag-handle");
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 140, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/panel=/);
  await expect(opener).toBeFocused();
});

test("the background atom stops rendering during a panel and resumes after dismissal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const monitor = window as unknown as { atomDraws: number };
    monitor.atomDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      monitor.atomDraws++;
      return draw.apply(this, args);
    };
  });
  await ready(page);
  const draws = () => page.evaluate(() => (window as unknown as { atomDraws: number }).atomDraws);
  await expect.poll(draws).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Element library" })).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const stopped = await draws();
  await page.waitForTimeout(200);
  expect(await draws()).toBe(stopped);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(draws).toBeGreaterThan(stopped);
});

test("answer explanations remain until the reader chooses the next question", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Open discovery journal", exact: true }).click();
  const journal = page.getByRole("dialog", { name: "Your discovery journal" });
  await journal.getByRole("tab", { name: "Practice", exact: true }).click();
  await page.locator("#qa .opt").first().click();
  const explanation = page.locator(".quiz-explanation");
  await expect(explanation).toBeVisible();
  const text = await explanation.textContent();
  await page.waitForTimeout(2800);
  await expect(explanation).toHaveText(text!);
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await expect(page.locator("#qa .opt").first()).toBeEnabled();
  await expect(page.locator("#qa .opt").first()).toBeFocused();
});
