import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAuthenticatedPage } from "../scripts/check-deployment.mjs";
import test from "node:test";
const fromCli = createRequire(import.meta.resolve("vercel/package.json"));
test("the actual locked CLI receives authenticated curl arguments without leaking global flags", async () => {
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
        args.splice(2, 0, "--api", `http://127.0.0.1:${api.address().port}`);
        args.splice(args.indexOf("--"), 0, "--protection-bypass", "test-only-bypass");
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
    assert.ok(!args.includes("--api"));
    assert.ok(!args.includes("--protection-bypass"));
    assert.ok(args.includes("--silent"));
    assert.ok(args.includes("--max-redirs"));
    assert.ok(args.includes("https://staged-hydromental.vercel.app/elements"));
  } finally {
    api.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
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
