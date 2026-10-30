import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceModelMotion,
  advanceSpring,
  clampZoom,
  createModelMotion,
  getShellFocus,
  nucleusLayout,
  rotateModel,
  springValue,
} from "../lib/model-motion.ts";

test("a displaced model spring settles without numerical explosions at different frame rates", () => {
  for (const fps of [15, 30, 60, 120]) {
    const spring = springValue(0.55);
    spring.target = 1;
    for (let frame = 0; frame < fps * 4; frame++) {
      advanceSpring(spring, 1 / fps, 190, 14);
      assert(spring.value > 0.4 && spring.value < 1.3);
    }
    assert(Math.abs(spring.value - 1) < 0.001);
    assert(Math.abs(spring.velocity) < 0.001);
  }
});

test("inertia decays consistently across display refresh rates", () => {
  const final = [30, 60, 120].map((fps) => {
    const model = createModelMotion();
    model.vy = 3;
    for (let frame = 0; frame < fps; frame++) advanceModelMotion(model, 1 / fps);
    assert(model.vy < 0.04);
    return model.y;
  });
  assert(Math.max(...final) - Math.min(...final) < 0.00001);
});

test("reduced motion and pause stop inertia and automatic rotation while allowing direct manipulation", () => {
  const model = createModelMotion();
  rotateModel(model, 20, -10);
  const { x, y, time } = model;
  model.zoom.target = 1.5;
  model.spread.target = 1;
  model.pulse.velocity = 5;
  for (let i = 0; i < 20; i++) advanceModelMotion(model, 1 / 60, true);
  assert.equal(model.x, x);
  assert.equal(model.y, y);
  assert.equal(model.time, time);
  assert.equal(model.zoom.value, 1.5);
  assert.equal(model.spread.value, 1);
  assert.equal(model.pulse.value, 0);
  assert.equal(model.vx + model.vy, 0);
  assert.equal(clampZoom(0.01), 0.65);
  assert.equal(clampZoom(100), 1.85);
});

test("one-based shell focus reports accurate counts without inventing invalid selections", () => {
  const shells = [2, 8, 1];
  assert.deepEqual(getShellFocus(shells, 1), { number: 1, electrons: 2 });
  assert.deepEqual(getShellFocus(shells, 3), { number: 3, electrons: 1 });
  for (const invalid of [null, 0, 4, 1.5, -1, Number.NaN]) {
    assert.equal(getShellFocus(shells, invalid), null);
  }
});

test("all supported nuclei preserve the exact proton and representative neutron populations", () => {
  for (let z = 1; z <= 118; z++) {
    const mass = z === 1 ? 1 : Math.round(z * 2.5);
    const layout = nucleusLayout(z, mass);
    assert.equal(layout.particles.length, mass);
    assert.equal(layout.particles.filter((particle) => particle.proton).length, z);
    assert.equal(layout.particles.filter((particle) => !particle.proton).length, mass - z);
    assert(layout.radius > 0 && layout.radius < 0.3);
    for (const particle of layout.particles) assert(particle.position.every(Number.isFinite));
    for (let axis = 0; axis < 3; axis++) {
      const mean =
        layout.particles.reduce((sum, particle) => sum + particle.position[axis], 0) / mass;
      assert(Math.abs(mean) < 1e-10);
    }
  }
});
