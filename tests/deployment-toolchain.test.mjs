import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAuthenticatedPage } from "../scripts/check-deployment.mjs";
import test from "node:test";
const fromCli = createRequire(import.meta.resolve("vercel/package.json"));
test("the actual locked CLI keeps authenticated smoke options compatible with native curl", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elementals-curl-contract-"));
  writeFileSync(
    join(directory, "curl"),
    '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)) + "\\n200");\n',
    { mode: 0o755 },
  );
  const api = createServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ user: { uid: "testuser", username: "testuser" } }));
  });
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  try {
    const response = await readAuthenticatedPage(
      new URL("https://staged-hydromental.vercel.app/elements"),
      async (command, args, options) => {
        // A synthetic bypass avoids all provider requests. The fake native curl
        // records argv without making a network request or using real credentials.
        args.splice(
          args.indexOf("--"),
          0,
          "--api",
          `http://127.0.0.1:${api.address().port}`,
          "--protection-bypass",
          "test-only-bypass",
        );
        return promisify(execFile)(command, args, {
          ...options,
          encoding: "utf8",
          env: {
            ...options.env,
            VERCEL_TOKEN: "testonly",
            PATH: `${directory}:${process.env.PATH}`,
          },
        });
      },
    );
    const args = await response.json();
    assert.ok(!args.includes("--non-interactive"));
    assert.ok(!args.includes("--protection-bypass"));
    assert.ok(args.includes("--silent"));
    assert.ok(args.includes("--max-redirs"));
    assert.equal(args[args.indexOf("--url") + 1], "https://staged-hydromental.vercel.app/elements");
  } finally {
    api.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test("the locked CLI uses the patched HTTP client for its fetch/Agent/FormData APIs", async () => {
  const { fetch, Agent, FormData } = fromCli("undici");
  assert.equal(fromCli("undici/package.json").version, "6.29.1");
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
  assert.equal(version.trim(), fromCli("vercel/package.json").version);
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

test("the Vercel CLI lock graph contains only patched Zod copies", () => {
  const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
  assert.match(lock, /^  zod@4\.6\.6:$/m);
  assert.doesNotMatch(lock, /^  zod@(?:[0123]\.|4\.[0-5]\.|4\.6\.[0-5](?:\D|$))/m);
});
