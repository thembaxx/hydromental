import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("a missing scientific comparison base is an operational failure, not a proposed update", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/science-diff.mjs", "--quiet", "--base", "refs/missing-scientific-comparison-base"],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" },
  );
  assert.equal(result.status, 2);
  assert.match(result.stderr, /comparison failed/);
});
