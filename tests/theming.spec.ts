import { expect, test } from "./fixtures";
import { LEARNING_STORAGE_KEY, initialLearningState } from "../lib/learning";
import { themeSurfaces, type SurfaceTheme } from "../lib/theme";

test("saved themes paint before app scripts and stylesheets arrive", async ({
  browser,
  baseURL,
}) => {
  for (const theme of ["day", "midnight", "dusk", "noir"] as SurfaceTheme[]) {
    const context = await browser.newContext({
      baseURL,
      colorScheme: "dark",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const state = initialLearningState();
    state.settings.theme = theme;
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
      key: LEARNING_STORAGE_KEY,
      state,
    });
    await page.route("**/_next/static/**", (route) =>
      /\.(css|js)(?:\?|$)/.test(route.request().url()) ? route.abort() : route.continue(),
    );
    await page.goto("/");
    await expect(page.getByRole("status")).toContainText("Loading your element explorer");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("#app-theme-color")).toHaveAttribute(
      "content",
      themeSurfaces[theme].color,
    );
    await expect(page.locator("html")).toHaveCSS("color-scheme", themeSurfaces[theme].scheme);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      `/manifests/${theme}/manifest.webmanifest`,
    );
    expect(
      await page.evaluate(() => ({
        root: getComputedStyle(document.documentElement).backgroundColor,
        body: getComputedStyle(document.body).backgroundColor,
        layer: getComputedStyle(document.body, "::before").backgroundColor,
      })),
    ).toEqual(
      await page.evaluate((color) => {
        const node = document.createElement("div");
        node.style.color = color;
        document.body.append(node);
        const rgb = getComputedStyle(node).color;
        node.remove();
        return { root: rgb, body: rgb, layer: rgb };
      }, themeSurfaces[theme].color),
    );
    await context.close();
  }
});

test("device themes work without JavaScript and with unavailable storage", async ({
  browser,
  baseURL,
}) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled,
      colorScheme: "dark",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    if (javaScriptEnabled)
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new Error("blocked");
          },
        });
      });
    await page.goto("/elements/oxygen");
    await expect(page.getByRole("heading", { name: "Oxygen", exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("background-color", "rgb(10, 16, 40)");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveCSS("background-color", "rgb(240, 245, 252)");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await context.close();
  }
});

test("browser tint and install manifest follow live device and explicit appearance changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/playground");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifests/day/manifest.webmanifest",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifests/midnight/manifest.webmanifest",
  );
  await page.getByRole("button", { name: "Playground settings" }).click();
  await page.getByLabel("Appearance", { exact: true }).selectOption("noir");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#000");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifests/noir/manifest.webmanifest",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#000");
  await page.getByLabel("Appearance", { exact: true }).selectOption("");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifests/day/manifest.webmanifest",
  );
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.goto("/elements/oxygen");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    "content",
    themeSurfaces.day.color,
  );
});

test("one viewport background covers short, long, landscape and resized pages", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/elements");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const coverage = await page.evaluate(() => {
      const layer = getComputedStyle(document.body, "::before");
      return {
        position: layer.position,
        top: layer.top,
        bottom: layer.bottom,
        left: layer.left,
        right: layer.right,
        root: getComputedStyle(document.documentElement).backgroundColor,
        body: getComputedStyle(document.body).backgroundColor,
        height: document.body.getBoundingClientRect().height,
        viewport: innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(coverage.position).toBe("fixed");
    expect([coverage.top, coverage.bottom, coverage.left, coverage.right]).toEqual([
      "0px",
      "0px",
      "0px",
      "0px",
    ]);
    expect(coverage.root).toBe(coverage.body);
    expect(coverage.height).toBeGreaterThanOrEqual(coverage.viewport);
    expect(coverage.overflow).toBe(false);
    await page.goto("/playground");
    await expect(page.locator(".playground-page")).toHaveCSS("background-image", "none");
    await expect(page.locator(".playground-page")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  }
});

test("install manifests preserve app identity and supply each theme's launch colors", async ({
  request,
}) => {
  for (const [theme, surface] of Object.entries(themeSurfaces)) {
    const response = await request.get(`/manifests/${theme}/manifest.webmanifest`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/manifest+json");
    const manifest = await response.json();
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.background_color).toBe(surface.color);
    expect(manifest.theme_color).toBe(surface.color);
  }
  expect((await request.get("/manifests/unknown/manifest.webmanifest")).status()).toBe(404);
});

test("uncached offline pages and theme manifests keep the saved Noir background", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  const state = initialLearningState();
  state.settings.theme = "noir";
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: LEARNING_STORAGE_KEY,
    state,
  });
  await page.goto("/playground");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto("/elements/oganesson");
  await expect(page.getByRole("heading", { name: "Science can wait for a signal." })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#000");
  expect(
    await page.evaluate(
      async () =>
        (await (await fetch("/manifests/noir/manifest.webmanifest")).json()).background_color,
    ),
  ).toBe("#000");
  await context.setOffline(false);
});
