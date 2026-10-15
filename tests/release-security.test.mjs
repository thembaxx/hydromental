import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const fromRelease = createRequire(import.meta.resolve("semantic-release"));
const fromMicromatch = createRequire(fromRelease.resolve("micromatch"));
const braces = fromMicromatch("braces");

test("release glob parsing rejects deeply nested patterns before recursive evaluation", () => {
  for (const [open, close] of [
    ["{", "}"],
    ["(", ")"],
  ]) {
    const hostile = open.repeat(512) + "a,b" + close.repeat(512);
    assert.throws(() => braces(hostile), /Maximum brace nesting depth exceeded/);
    assert.throws(() => braces.expand(hostile), /Maximum brace nesting depth exceeded/);
    assert.throws(() => braces.parse(hostile), /Maximum brace nesting depth exceeded/);
  }
});
test("the release guard preserves normal branch and commit glob matching", () => {
  const micromatch = fromRelease("micromatch");
  assert.deepEqual(micromatch(["main", "next", "feature/ripple"], ["{main,next}"]), [
    "main",
    "next",
  ]);
  assert.deepEqual(braces.expand("release-{1..3}"), ["release-1", "release-2", "release-3"]);
});
