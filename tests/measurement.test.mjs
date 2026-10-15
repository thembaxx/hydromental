import assert from "node:assert/strict";
import test from "node:test";
import { measurementAllowed, measurementUrl, sanitizeMeasurement } from "../lib/measurement.ts";
test("measurement defaults to off and strips sensitive URL fields", () => {
  assert.equal(measurementAllowed(), false);
  assert.equal(
    measurementUrl("https://example.com/elements/lithium?journal=private#token"),
    "https://example.com/elements/lithium",
  );
  assert.equal(
    measurementUrl("https://example.com/my/private/creation"),
    "https://example.com/other",
  );
});
test("only allowlisted event names and fixed fields can be collected", () => {
  assert.deepEqual(
    sanitizeMeasurement("quiz_answer", {
      mode: "standard",
      concept: "symbol",
      result: "correct",
      element: 8,
      search: "private text",
      creation: "secret",
    }),
    { concept: "standard:symbol", result: "correct" },
  );
  assert.equal(sanitizeMeasurement("custom_private_event", {}), null);
  assert.equal(sanitizeMeasurement("__proto__", {}), null);
  assert.equal(sanitizeMeasurement("quiz_started", { mode: "my private journal" }), null);
  assert.equal(sanitizeMeasurement("element_discovered", { element: 119 }), null);
  assert.equal(sanitizeMeasurement("element_discovered", { element: Number.NaN }), null);
});
