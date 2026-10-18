import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { serviceWorkerSource } from "../lib/service-worker-source.ts";

test("offline installation deduplicates absolute shell URLs and relative lazy assets", async () => {
  let install;
  const saved = [];
  const source = serviceWorkerSource
    .replace("__CACHE_VERSION__", JSON.stringify("elementals-test"))
    .replace(
      "__BUILD_ASSETS__",
      JSON.stringify(["/_next/static/chunks/main.js", "/_next/static/chunks/elemental.js"]),
    );
  runInNewContext(source, {
    URL,
    self: {
      location: { origin: "https://elementals.test" },
      addEventListener(name, callback) {
        if (name === "install") install = callback;
      },
    },
    caches: {
      async open(name) {
        return {
          async addAll(paths) {
            const absolute = paths.map((path) => new URL(path, "https://elementals.test").href);
            assert.equal(
              new Set(absolute).size,
              absolute.length,
              "Cache.addAll rejects duplicate request keys",
            );
            if (name.endsWith("-assets")) saved.push(...absolute);
          },
          async add() {},
          async match() {
            return new Response('<script src="/_next/static/chunks/main.js"></script>');
          },
        };
      },
    },
  });
  let completion;
  install({
    waitUntil(promise) {
      completion = promise;
    },
  });
  await completion;
  assert.equal(saved.length, 17);
  assert(saved.includes("https://elementals.test/_next/static/chunks/elemental.js"));
  for (const name of ["hydro", "ember", "solar", "breeze"]) {
    assert(saved.includes(`https://elementals.test/models/${name}.glb`));
    assert(saved.includes(`https://elementals.test/auras/${name}.png`));
  }
  for (const name of ["felt", "notch", "halo", "dew", "bloom", "shrug", "crest"])
    assert(saved.includes(`https://elementals.test/sounds/${name}.wav`));
});
