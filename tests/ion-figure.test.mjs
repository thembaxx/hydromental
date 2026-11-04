import test from "node:test";
import assert from "node:assert/strict";
import { ionCharge, simpleShells, chargeText, EXAMPLE_ELEMENTS } from "../lib/ion-figure.ts";

test("charge is protons minus electrons", () => {
  for (const element of EXAMPLE_ELEMENTS) {
    assert.equal(ionCharge(element.protons, element.protons), 0);
    assert.equal(ionCharge(element.protons, element.protons + 1), -1);
    assert.equal(ionCharge(element.protons, element.protons - 1), 1);
  }
  assert.equal(chargeText(-2), "2 negative");
  assert.equal(chargeText(1), "+1 positive");
});
test("schematic electron shells retain counts without negative occupancy", () => {
  for (let electrons = 0; electrons <= 10; electrons++)
    assert.equal(
      simpleShells(electrons).reduce((a, b) => a + b, 0),
      electrons,
    );
  assert.throws(() => ionCharge(3, -1), RangeError);
  assert.throws(() => simpleShells(11), RangeError);
});
