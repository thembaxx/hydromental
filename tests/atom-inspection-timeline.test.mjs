import assert from "node:assert/strict";
import test from "node:test";
import { atomInspectionLabel, sampleAtomInspection } from "../lib/atom-inspection-timeline.ts";

test("atom inspection timeline progressively separates shells and nucleus", () => {
  const assembled = sampleAtomInspection(0, 3);
  const exposed = sampleAtomInspection(1, 3);
  assert.equal(assembled.nucleusSpread, 1);
  assert.ok(exposed.nucleusSpread > assembled.nucleusSpread);
  assert.ok(exposed.shells[2].offset > exposed.shells[0].offset);
  assert.ok(exposed.shells[2].opacity < exposed.shells[0].opacity);
});

test("timeline clamps invalid values and labels each teaching stage", () => {
  assert.equal(sampleAtomInspection(Number.NaN, 3).progress, 0);
  assert.equal(sampleAtomInspection(5, 3).progress, 1);
  assert.equal(sampleAtomInspection(0.1, 3).shells.length, 3);
  assert.equal(atomInspectionLabel(0.1), "assembled atom");
  assert.equal(atomInspectionLabel(0.35), "electron shells separated");
  assert.equal(atomInspectionLabel(0.6), "electron clouds isolated");
  assert.equal(atomInspectionLabel(0.9), "nucleus exposed");
});
