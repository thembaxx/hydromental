import { expect, test } from "./fixtures";

test("element library and reference content are readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto("/elements");
    await expect(page.getByRole("heading", { name: "Meet the elements." })).toBeVisible();
    await expect(page.locator(".reference-element-link")).toHaveCount(118);
    await page.locator('.reference-element-link[href="/elements/hydrogen"]').click();
    await expect(page.getByRole("heading", { name: "Hydrogen", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Follow the science" })).toBeVisible();
    await expect(page.locator(".reference-section a").first()).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/elements\/hydrogen$/,
    );
    const structured = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(
      structured
        .map((value) => JSON.parse(value))
        .some((value) => value["@type"] === "DefinedTerm" && value.name === "Hydrogen"),
    ).toBe(true);
    await expect(page.getByRole("link", { name: "Explore Hydrogen's atom" })).toHaveAttribute(
      "href",
      "/?element=H",
    );
  } finally {
    await context.close();
  }
});

test("discovery endpoints expose all elements and a complete install manifest", async ({
  request,
}) => {
  const alias = await request.get("/elements/aluminum");
  expect(alias.url()).toContain("/elements/aluminium");
  expect((await request.get("/elements/not-an-element")).status()).toBe(404);
  const data = await request.get("/element-data.json");
  expect(data.ok()).toBe(true);
  const payload = await data.json();
  expect(payload.elements).toHaveLength(118);
  expect(
    payload.elements.every(
      (element: { science: { sources: unknown[]; configuration: string } }) =>
        element.science.sources.length > 0 && element.science.configuration.length > 0,
    ),
  ).toBe(true);
  const sitemap = await request.get("/sitemap.xml");
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(121);
  expect(await sitemap.text()).toContain("/welcome");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("sitemap.xml");
  const llms = await request.get("/llms.txt");
  expect(llms.headers()["content-type"]).toContain("text/plain");
  expect(await llms.text()).toContain("illustrative shell models");
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toContain("Elementals");
  expect(manifest.display).toBe("standalone");
  expect(
    manifest.icons.some(
      (icon: { purpose: string; sizes: string }) =>
        icon.purpose === "maskable" && icon.sizes === "512x512",
    ),
  ).toBe(true);
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});

test("production offline shell, visited references, and element data remain available", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.goto("/elements/hydrogen");
  await expect(page.getByRole("heading", { name: "Hydrogen", exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const names = await caches.keys();
        const name = names.find((key) => key.endsWith("-pages"));
        if (!name) return false;
        const pageCache = await caches.open(name);
        return Boolean(await pageCache.match(location.href, { ignoreVary: true }));
      }),
    )
    .toBe(true);
  // A public HTML page is still usable when later navigation headers differ.
  // Production Next.js responses vary on RSC/router headers and Accept-Encoding;
  // add an explicit variant here so this regression cannot depend on the browser.
  await page.evaluate(async () => {
    const names = await caches.keys();
    const pageCache = await caches.open(names.find((name) => name.endsWith("-pages"))!);
    const response = (await pageCache.match(location.href, { ignoreVary: true }))!;
    const headers = new Headers(response.headers);
    headers.append("Vary", "X-Elementals-Offline-Variant");
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");
    await pageCache.put(
      new Request(location.href, { headers: { "X-Elementals-Offline-Variant": "online" } }),
      new Response(await response.arrayBuffer(), { status: response.status, headers }),
    );
    const cached = await pageCache.match(location.href, { ignoreVary: true });
    if (!cached?.headers.get("content-type")?.includes("text/html")) {
      throw new Error("The visited reference must be cached as public HTML.");
    }
  });
  await context.setOffline(true);
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("status").filter({ hasText: "Offline" })).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
  const count = await page.evaluate(
    async () => (await (await fetch("/element-data.json")).json()).elements.length,
  );
  expect(count).toBe(118);
  await page.goto("/elements/hydrogen");
  await expect(page.getByRole("heading", { name: "Hydrogen", exact: true })).toBeVisible();
  await page.goto("/elements/oganesson");
  await expect(page.getByRole("heading", { name: "Science can wait for a signal." })).toBeVisible();
  await context.setOffline(false);
});

test("installation is optional and shown only after a supported browser prompt", async ({
  page,
}) => {
  await page.goto("/elements");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompted = "true";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Install Elementals", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-install-prompted", "true");
  await expect(page.getByRole("button", { name: "Install Elementals", exact: true })).toHaveCount(
    0,
  );
});
