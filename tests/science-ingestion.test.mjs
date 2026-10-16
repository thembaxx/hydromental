import assert from "node:assert/strict";
import test from "node:test";
import { parseCiaaw, parseNist, parseNubase } from "../lib/science-ingestion.mjs";
import { validateScienceSnapshot } from "../lib/science-validation.mjs";
import { readFileSync } from "node:fs";
const snapshot = JSON.parse(
  readFileSync(new URL("../lib/science-data.json", import.meta.url), "utf8"),
);
test("upstream format changes and incomplete sources fail closed", () => {
  assert.throws(() => parseCiaaw("Standard Atomic Weights 2025"), /edition changed/);
  assert.throws(() =>
    parseCiaaw('Standard Atomic Weights 2024<table id="mytable"><tr><td>1</td></tr></table>'),
  );
  assert.throws(() => parseNist("<pre>Atomic Number = 1</pre>"), /Incomplete NIST/);
  assert.throws(() => parseNubase("# Nubase2024 citation:"), /Unexpected NUBASE/);
});
test("scientific HTML parsing decodes entities and reads text without executing markup", () => {
  const rows = Array.from(
    { length: 118 },
    (_, index) =>
      `<tr><td>${index + 1}</td><td>H</td><td><script>throw new Error('not executable')</script>Example</td><td>${index === 0 ? "<b>[1.00784,&nbsp;1.00811]</b>" : "1.0"}</td><td></td></tr>`,
  ).join("");
  const records = parseCiaaw(`Standard Atomic Weights 2024<table id="mytable">${rows}</table>`);
  assert.deepEqual(records[0].interval, [1.00784, 1.00811]);
  assert.equal(records.length, 118);
});
test("the master snapshot validates and rejects missing provenance or fabricated precision", () => {
  assert.equal(validateScienceSnapshot(snapshot), true);
  for (const corrupt of [
    (data) => {
      data.records[0].properties[0].numericValue = 1.008;
    },
    (data) => {
      data.records[0].properties[0].unit = "u";
    },
    (data) => {
      data.records[0].properties[0].sourceId = "unknown";
    },
    (data) => {
      data.records[0].properties[0].conditions = null;
    },
    (data) => {
      data.records[0].isotopes[0].massNumber = 0;
    },
    (data) => {
      data.records[0].isotopes[0].sources.massAndAbundance = "unknown";
    },
  ]) {
    const broken = structuredClone(snapshot);
    corrupt(broken);
    assert.throws(() => validateScienceSnapshot(broken));
  }
});
