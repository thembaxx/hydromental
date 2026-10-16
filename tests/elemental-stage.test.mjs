import assert from "node:assert/strict";
import test from "node:test";
import { cloudPositions, matterPhase, representativeMassNumber } from "../lib/elemental-stage.ts";
import { ElementalSoundEngine } from "../lib/sound-engine.ts";

test("cloud sampling is deterministic, bounded, centered and distributed across all octants", () => {
  const positions = cloudPositions(8, 2);
  assert.deepEqual(positions, cloudPositions(8, 2));
  assert.notDeepEqual(positions, cloudPositions(9, 2));
  const octants = new Set();
  const sums = [0, 0, 0];
  for (let i = 0; i < positions.length; i += 3) {
    const xyz = Array.from(positions.slice(i, i + 3));
    assert(xyz.every(Number.isFinite));
    assert(Math.hypot(...xyz) <= 3.201);
    octants.add(xyz.map((value) => (value > 0 ? 1 : 0)).join(""));
    xyz.forEach((value, axis) => {
      sums[axis] += value;
    });
  }
  assert.equal(octants.size, 8);
  assert(sums.every((sum) => Math.abs(sum / 1200) < 0.06));
});

test("matter mapping preserves unknown states instead of claiming a solid", () => {
  assert.deepEqual(["s", "l", "g", "u"].map(matterPhase), ["solid", "liquid", "gas", "unknown"]);
});

test("nucleus counts use the most abundant isotope or the evaluated representative", () => {
  assert.equal(
    representativeMassNumber(
      [
        { massNumber: 54, abundance: "0.05845(35)", representative: false },
        { massNumber: 56, abundance: "0.91754(36)", representative: false },
      ],
      26,
    ),
    56,
  );
  assert.equal(
    representativeMassNumber([{ massNumber: 295, abundance: null, representative: true }], 118),
    295,
  );
});

test("audio imports and every feedback method are safe without browser APIs", () => {
  const engine = new ElementalSoundEngine();
  assert.equal(engine.isMuted, true);
  for (const muted of [false, true]) {
    engine.isMuted = muted;
    engine.playScrubTick(118);
    engine.playElementResonance(8, 2);
    engine.playExcitePulse(1);
  }
  engine.dispose();
});
