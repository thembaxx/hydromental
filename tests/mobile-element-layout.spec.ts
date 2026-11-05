import { expect, test } from "./fixtures";

for (const { width, slug, name } of [
  { width: 390, slug: "hydrogen", name: "Hydrogen" },
  { width: 320, slug: "rutherfordium", name: "Rutherfordium" },
]) {
  test(`mobile element stage contains the entire ${name} heading, story, and actions at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?element=${slug}`);
    await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#in h1")).toHaveText(name);
    await page.evaluate(() => document.fonts.ready);

    const bounds = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing layout element: ${selector}`);
        const box = element.getBoundingClientRect();
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
      };
      const header = document.querySelector(".hydro-experience .site-header");
      if (!header) throw new Error("Missing element header");
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        headerTopPadding: Number.parseFloat(getComputedStyle(header).paddingTop),
        stage: rect("#app"),
        canvas: rect(".elemental-canvas"),
        kicker: rect(".element-kicker"),
        heading: rect("#in h1"),
        story: rect(".element-story"),
        actions: rect(".element-actions"),
      };
    });

    expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.viewportWidth + 1);
    expect(bounds.headerTopPadding).toBeGreaterThanOrEqual(16);
    expect(bounds.kicker.top).toBeGreaterThanOrEqual(bounds.canvas.bottom + 8);
    expect(bounds.heading.bottom).toBeLessThan(bounds.story.top);
    expect(bounds.story.bottom).toBeLessThanOrEqual(bounds.actions.top);
    expect(bounds.actions.bottom).toBeLessThanOrEqual(bounds.stage.bottom - 50);
    expect(bounds.heading.left).toBeGreaterThanOrEqual(bounds.stage.left);
    expect(bounds.heading.right).toBeLessThanOrEqual(bounds.stage.right);
  });
}
