import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import { readAuthenticatedPage } from "../scripts/check-deployment.mjs";
import test from "node:test";
const fromCli = createRequire(import.meta.resolve("vercel/package.json"));
test("the locked CLI uses the patched HTTP client for its fetch/Agent/FormData APIs", async () => {
  const { fetch, Agent, FormData } = fromCli("undici");
  assert.equal(fromCli("undici/package.json").version, "6.29.0");
  const server = createServer(async (request, response) => {
    let size = 0;
    for await (const chunk of request) size += chunk.length;
    response.end(JSON.stringify({ size, type: request.headers["content-type"] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const agent = new Agent();
  try {
    const form = new FormData();
    form.set("deployment", "verified");
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`, {
      method: "POST",
      body: form,
      dispatcher: agent,
    });
    const result = await response.json();
    assert.ok(result.size > 0);
    assert.match(result.type, /multipart\/form-data/);
  } finally {
    await agent.close();
    server.close();
  }
});
test("the pinned CLI executes and our staging checker never invokes login without credentials", async () => {
  const version = execFileSync("pnpm", ["exec", "vercel", "--version"], {
    encoding: "utf8",
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1", NO_UPDATE_NOTIFIER: "1" },
  });
  assert.match(version, /64\.0\.2/);
  const previous = process.env.VERCEL_TOKEN;
  delete process.env.VERCEL_TOKEN;
  try {
    await assert.rejects(
      readAuthenticatedPage(new URL("https://staged-hydromental.vercel.app")),
      /require.*VERCEL_TOKEN/,
    );
  } finally {
    if (previous === undefined) delete process.env.VERCEL_TOKEN;
    else process.env.VERCEL_TOKEN = previous;
  }
});
