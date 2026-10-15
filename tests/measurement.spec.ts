import { expect, test } from "./fixtures";

test("no measurement SDK loads before consent, URL fields are stripped and withdrawal stops sends", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/_vercel/insights/script.js", (route) => {
    requests.push("analytics");
    return route.fulfill({
      contentType: "application/javascript",
      body: `const queue = window.vaq || []; window.va = (type, data) => { if (type === 'beforeSend') window.testBeforeSend = data; }; queue.forEach(args => window.va(...args));`,
    });
  });
  await page.route("**/_vercel/speed-insights/script.js", (route) => {
    requests.push("speed");
    return route.fulfill({ contentType: "application/javascript", body: "window.si = () => {};" });
  });
  await page.goto("/privacy?journal=private#private");
  const choice = page.getByRole("checkbox", {
    name: "Share anonymous usage and performance statistics",
  });
  await expect(choice).not.toBeChecked();
  expect(requests).toEqual([]);
  await choice.check();
  await expect.poll(() => requests.length).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(
        () => typeof (window as unknown as { testBeforeSend?: unknown }).testBeforeSend,
      ),
    )
    .toBe("function");
  expect(
    await page.evaluate(() =>
      (window as unknown as { testBeforeSend: (event: unknown) => unknown }).testBeforeSend({
        type: "pageview",
        url: location.href,
      }),
    ),
  ).toEqual({ type: "pageview", url: "http://127.0.0.1:3000/privacy" });
  await choice.uncheck();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testBeforeSend: (event: unknown) => unknown }).testBeforeSend({
        type: "pageview",
        url: location.href,
      }),
    ),
  ).toBeNull();
});
test("browser privacy signals override a previously saved opt-in", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("elementals.measurement.v1", "granted");
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_vercel/")) requests.push(request.url());
  });
  await page.goto("/privacy");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  expect(requests).toEqual([]);
});
