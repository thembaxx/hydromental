import { expect, test, type Page } from "@playwright/test";

async function loadExplorer(page: Page) {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
}

test("search suggests misspellings, filters families and supports keyboard selection", async ({
  page,
}) => {
  await loadExplorer(page);
  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  const input = page.getByRole("combobox", { name: "Search elements" });
  await expect(input).toBeFocused();
  await input.fill("oxgyen");
  await expect(page.getByRole("option", { name: "Explore Oxygen, atomic number 8" })).toBeVisible();
  await input.press("Enter");
  await expect(page.locator("#in h1")).toHaveText("Oxygen");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  await page.getByLabel("Element family", { exact: true }).selectOption("g");
  await expect(
    page.getByRole("listbox", { name: "Suggested elements" }).getByRole("option"),
  ).toHaveCount(7);
  await expect(
    page.getByRole("option", { name: "Explore Helium, atomic number 2" }),
  ).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: "Explore Neon, atomic number 10" }),
  ).toHaveAttribute("aria-selected", "true");
  await input.press("Enter");
  await expect(page.locator("#in h1")).toHaveText("Neon");

  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  await input.fill("unobtainium");
  await expect(
    page.getByRole("listbox", { name: "Suggested elements" }).getByRole("option"),
  ).toHaveCount(0);
  await expect(page.locator(".search-status")).toContainText("No elements found");
  await input.press("Enter");
  await expect(page.getByRole("dialog", { name: "Find an element" })).toBeVisible();
});

test("dialogs confine keyboard focus, dismiss with Escape and restore the opener", async ({
  page,
}) => {
  await loadExplorer(page);
  const opener = page.getByRole("button", { name: "Search elements", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Find an element" });
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press(index < 4 ? "Tab" : "Shift+Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  const details = page.getByRole("button", { name: "Element details", exact: true });
  await details.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(details).toBeFocused();
});

test("narrow layout and enlarged search text remain usable without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await loadExplorer(page);
  const hasHorizontalOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(await hasHorizontalOverflow()).toBe(false);
  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Find an element" });
  await dialog.evaluate((element) => {
    const text = [
      ...element.querySelectorAll<HTMLElement>("h2,h3,p,span,small,input,select,button,label"),
    ];
    const sizes = text.map((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    text.forEach((node, index) => {
      node.style.fontSize = `${sizes[index] * 2}px`;
    });
  });
  const input = page.getByRole("combobox", { name: "Search elements" });
  await input.fill("Aluminium");
  await expect(
    page.getByRole("option", { name: "Explore Aluminium, atomic number 13" }),
  ).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  expect(await hasHorizontalOverflow()).toBe(false);
  await page.getByRole("button", { name: "Close search", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test("periodic table supports one tab stop, directional navigation and explicit zoom", async ({
  page,
}) => {
  await loadExplorer(page);
  await page.locator("#gb").click();
  await expect(page.locator('#tb button[tabindex="0"]')).toHaveCount(1);
  const oxygen = page.locator('#tb [aria-label="Oxygen"]');
  await oxygen.focus();
  await oxygen.press("ArrowRight");
  await expect(page.locator('#tb [aria-label="Fluorine"]')).toBeFocused();
  await page.keyboard.press("End");
  const last = page.locator('#tb [aria-label="Oganesson"]');
  await expect(last).toBeFocused();
  const before = await last.boundingBox();
  await page.getByRole("button", { name: "Larger table cells" }).click();
  await expect.poll(async () => (await last.boundingBox())!.width).toBeGreaterThan(before!.width);
  await last.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#in h1")).toHaveText("Oganesson");
});

test("long names and explorer controls fit narrow, landscape and desktop layouts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?element=Rf");
    await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#in h1")).toHaveText("Rutherfordium");
    // Hydration changes the long-name type size; measure after that layout settles.
    await expect
      .poll(() =>
        page
          .locator("#in h1")
          .evaluate(
            (title) =>
              title.getBoundingClientRect().height <=
              Number.parseFloat(getComputedStyle(title).lineHeight) + 1,
          ),
      )
      .toBe(true);
    const bounds = await page.evaluate(() => {
      const hint = document.querySelector("#hint")!.getBoundingClientRect();
      const mass = document.querySelector(".element-number")!.getBoundingClientRect();
      const camera = document.querySelector(".camera-tools")!.getBoundingClientRect();
      const title = document.querySelector("#in h1")!;
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        hintBottom: hint.bottom,
        hintTop: hint.top,
        massTop: mass.top,
        cameraBottom: camera.bottom,
        titleHeight: title.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(title).lineHeight),
      };
    });
    expect(bounds.overflow).toBe(false);
    expect(bounds.massTop).toBeGreaterThan(bounds.hintBottom + 5);
    expect(bounds.cameraBottom).toBeLessThan(bounds.hintTop);
    expect(bounds.titleHeight).toBeLessThanOrEqual(bounds.lineHeight + 1);
    await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  }
});
