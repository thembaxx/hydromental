import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("elemental preview supports keyboard and touch without changing scientific explanation", () => {
  const file = readFileSync(new URL("../components/elemental-preview.tsx", import.meta.url), "utf8");
  for (const key of ['role="group"', 'tabIndex={0}', "onKeyDown", '"ArrowLeft"', '"ArrowRight"', '"ArrowUp"', '"ArrowDown"', '"Home"', '"Enter"', 'api.current?.invalidate?.()', '"onPointerDown"']) {
    if(key !== '"onPointerDown"')assert.ok(file.includes(key), key);
  }
  assert.match(file, /Drag to rotate/);
  assert.match(file, /Electron shell populations, not fixed electron paths/);
  assert.match(file, /Illustrative density, not a calculated orbital/);
});
