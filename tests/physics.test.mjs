import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAVITY,
  forceBalance,
  projectile,
  projectileAt,
  projectilePresets,
} from "../lib/physics.ts";

const near = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
test("a 19.6 m/s vertical throw reaches 19.6 m after 2 s and returns after 4 s", () => {
  const setup = projectilePresets.vertical;
  const flight = projectile(setup);
  near(flight.duration, 4);
  near(flight.apexTime, 2);
  near(flight.maxHeight, 19.6);
  assert.equal(flight.vx, 0);
  assert.equal(flight.range, 0);
  const top = projectileAt(setup, 2);
  near(top.y, 19.6);
  near(top.vy, 0);
  near(top.ay, -9.8);
  const impact = projectileAt(setup, 4);
  near(impact.y, 0);
  near(impact.vy, -19.6);
});
test("a dropped object accelerates from rest and stops at the ground boundary", () => {
  const setup = projectilePresets.drop;
  near(projectile(setup).duration, 2);
  near(projectileAt(setup, 1).y, 14.7);
  near(projectileAt(setup, 1).vy, -9.8);
  near(projectileAt(setup, 100).time, 2);
  near(projectileAt(setup, 100).y, 0);
});
test("angled flight has constant horizontal velocity and conserves specific mechanical energy", () => {
  const setup = projectilePresets.components;
  const flight = projectile(setup);
  near(flight.range, 400 / GRAVITY);
  for (const fraction of [0, 0.2, 0.5, 0.9, 1]) {
    const state = projectileAt(setup, flight.duration * fraction);
    near(state.vx, 20 / Math.sqrt(2));
    near(0.5 * (state.vx ** 2 + state.vy ** 2) + GRAVITY * state.y, 200);
  }
});
test("Newton's second law preserves signs, equilibrium and vertical contact forces", () => {
  const right = forceBalance(5, 30, 10);
  near(right.net, 20);
  near(right.acceleration, 4);
  near(right.normal, 49);
  near(right.weight, right.normal);
  near(forceBalance(5, 10, 30).acceleration, -4);
  near(forceBalance(5, 30, 30).net, 0);
  near(forceBalance(10, 30, 10).acceleration, 2);
});
test("zero launch and non-finite control values remain finite and bounded", () => {
  assert.equal(projectile({ speed: 0, angle: 90, height: 0 }).duration, 0);
  const state = projectileAt({ speed: NaN, angle: Infinity, height: -10 }, NaN);
  assert(Object.values(state).every(Number.isFinite));
  assert(Object.values(forceBalance(0, Infinity, NaN)).every(Number.isFinite));
});
