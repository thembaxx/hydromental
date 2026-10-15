import assert from "node:assert/strict";
import test from "node:test";

let attempt = 0;
async function runSmoke(mockFetch, origin = "https://staged-hydromental.vercel.app") {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.DEPLOYMENT_URL;
  const previousBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  globalThis.fetch = mockFetch;
  process.env.DEPLOYMENT_URL = origin;
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "test-bypass";
  try {
    const moduleUrl = new URL("../scripts/check-deployment.mjs", import.meta.url);
    moduleUrl.searchParams.set("test", String(attempt));
    attempt += 1;
    await import(moduleUrl.href);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.DEPLOYMENT_URL;
    else process.env.DEPLOYMENT_URL = previousUrl;
    if (previousBypass === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = previousBypass;
  }
}

test("deployment checks verify every public entry point and scope the protection bypass", async () => {
  const paths = [];
  await runSmoke(async (url, options) => {
    assert.equal(url.origin, "https://staged-hydromental.vercel.app");
    assert.equal(options.headers["x-vercel-protection-bypass"], "test-bypass");
    assert.equal(options.redirect, "error");
    paths.push(url.pathname);
    return new Response(url.pathname === "/elements" ? "Hydrogen" : "Elementals");
  });
  assert.deepEqual(paths, ["/", "/elements", "/manifest.webmanifest"]);
});

test("deployment checks block promotion for a protected or broken site", async () => {
  await assert.rejects(
    runSmoke(async () => new Response("Login", { status: 403 })),
    /smoke check \(403\)/,
  );
  await assert.rejects(
    runSmoke(async () => new Response("Not the application")),
    /smoke check \(200\)/,
  );
});

test("deployment checks reject unexpected origins without sending credentials", async () => {
  await assert.rejects(
    runSmoke(() => {
      throw new Error("Must not fetch");
    }, "https://example.com"),
    /staged HTTPS Vercel/,
  );
});
