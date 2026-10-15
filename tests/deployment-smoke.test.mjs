import assert from "node:assert/strict";
import test from "node:test";
import { checkDeployment, readAuthenticatedPage } from "../scripts/check-deployment.mjs";

test("deployment checks verify app, library, manifest and the upgraded scientific data", async () => {
  const paths = [];
  await checkDeployment({
    origin: "https://staged-hydromental.vercel.app",
    fetchPage: async (url, options) => {
      assert.equal(url.origin, "https://staged-hydromental.vercel.app");
      assert.equal(options.redirect, "error");
      paths.push(url.pathname);
      return new Response(
        url.pathname === "/elements"
          ? "Hydrogen"
          : url.pathname === "/element-data.json"
            ? '{"schemaVersion":2}'
            : "Elementals",
      );
    },
  });
  assert.deepEqual(paths, ["/", "/elements", "/manifest.webmanifest", "/element-data.json"]);
});
test("a protected, redirected or broken staged site cannot be promoted", async () => {
  for (const [status, body] of [
    [403, "Login"],
    [302, "Redirect"],
    [200, "Not the application"],
  ])
    await assert.rejects(
      checkDeployment({
        origin: "https://staged-hydromental.vercel.app",
        fetchPage: async () => new Response(body, { status }),
      }),
      /smoke check/,
    );
  await assert.rejects(
    readAuthenticatedPage(new URL("https://staged-hydromental.vercel.app/"), async () => ({
      stdout: "Login\n302",
    })),
    /returned 302/,
  );
});
test("unexpected origins are rejected before any authenticated request", async () => {
  for (const origin of [
    "https://example.com",
    "https://staged-hydromental.vercel.app/path",
    "https://user:pass@staged-hydromental.vercel.app",
  ])
    await assert.rejects(
      checkDeployment({
        origin,
        fetchPage: () => {
          throw new Error("Must not fetch");
        },
      }),
      /staged HTTPS Vercel/,
    );
});
test("authenticated CLI requests scope the target, reject redirects and keep credentials out of argv", async () => {
  const response = await readAuthenticatedPage(
    new URL("https://staged-hydromental.vercel.app/elements"),
    async (command, args, options) => {
      assert.equal(command, "pnpm");
      assert.equal(args[3], "https://staged-hydromental.vercel.app/elements");
      assert.ok(args.includes("--non-interactive"));
      assert.ok(args.includes("--max-redirs"));
      assert.ok(!args.includes("--location"));
      assert.ok(!args.includes("--token"));
      assert.equal(options.timeout, 60_000);
      return { stdout: "Hydrogen\n200" };
    },
  );
  assert.equal(await response.text(), "Hydrogen");
});
