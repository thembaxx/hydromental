import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";
import { exportProgress, initialLearningState, saveCreation } from "../lib/learning";
import { newGameSession } from "../lib/playground";

test("public documents, data and worker have browser security headers", async ({ request }) => {
  for (const path of [
    "/",
    "/playground",
    "/welcome",
    "/elements/oxygen",
    "/offline.html",
    "/sw.js",
    "/element-data.json",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();
    const policy = headers["content-security-policy"];
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain("'unsafe-eval'");
  }
});

test("the browser blocks remote connections under the enforced policy", async ({ page }) => {
  await page.goto("/elements/oxygen");
  const result = await page.evaluate(async () => {
    const violation = new Promise<{ directive: string; blocked: string }>((resolve) => {
      document.addEventListener(
        "securitypolicyviolation",
        (event) => resolve({ directive: event.effectiveDirective, blocked: event.blockedURI }),
        { once: true },
      );
    });
    let rejected = false;
    try {
      await fetch("https://example.invalid/security-audit-probe");
    } catch {
      rejected = true;
    }
    return { rejected, violation: await violation };
  });
  expect(result.rejected).toBe(true);
  expect(result.violation.directive).toBe("connect-src");
  expect(result.violation.blocked).toContain("example.invalid");
});

test("the browser rejects framing the application", async ({ page, baseURL }) => {
  await page.route("**/security-frame-host", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<iframe src="${baseURL}/elements/oxygen"></iframe>`,
    }),
  );
  const blocked = page.waitForEvent("console", {
    predicate: (message) => /frame-ancestors|X-Frame-Options/i.test(message.text()),
  });
  await page.goto("/security-frame-host");
  expect((await blocked).type()).toBe("error");
  expect(
    await page.locator("iframe").evaluate((frame: HTMLIFrameElement) => {
      try {
        return frame.contentDocument?.body?.textContent || "";
      } catch {
        return "";
      }
    }),
  ).not.toContain("Oxygen");
});

test("hostile backup titles remain inert in the UI and exported SVG", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const title = '<img src=x onerror="window.__injected=true">';
  const state = saveCreation(initialLearningState(), {
    id: "creation-hostile",
    title,
    at: Date.now(),
    session: newGameSession("molecule", 0, true),
  });
  // JSON object keys are rejected by the import boundary instead of merged into live objects.
  const backup = JSON.parse(exportProgress(state));
  backup.state.mastery = JSON.parse('{"__proto__":{"polluted":true}}');
  await page.goto("/playground");
  await page.getByRole("button", { name: "Playground settings" }).click();
  await page.getByLabel("Restore a progress backup").setInputFiles({
    name: "hostile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => ({
      executed: "__injected" in window,
      polluted: "polluted" in Object.prototype,
      injectedImages: document.querySelectorAll('img[src="x"]').length,
    })),
  ).toEqual({ executed: false, polluted: false, injectedImages: 0 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: `Export ${title} as SVG`, exact: true }).click();
  const svg = await readFile((await (await download).path())!, "utf8");
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    return {
      title: doc.querySelector("title")?.textContent,
      errors: doc.querySelectorAll("parsererror").length,
      activeNodes: doc.querySelectorAll("script, foreignObject, image, img, a").length,
      handlers: [...doc.querySelectorAll("*")]
        .flatMap((node) => [...node.attributes])
        .filter((attribute) => attribute.name.startsWith("on")).length,
    };
  }, svg);
  expect(parsed).toEqual({ title, errors: 0, activeNodes: 0, handlers: 0 });
});
