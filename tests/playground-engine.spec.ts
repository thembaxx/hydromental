import { expect, test } from "@playwright/test";
import { gameRounds, sanitizeGameSession } from "../lib/learning";
import {
  atomTargets,
  checkGame,
  crystalModel,
  equationCounts,
  equations,
  molecules,
  mysteryElements,
  newGameSession,
  normalizeSession,
  objects,
  periodicHoles,
  propertyRounds,
  propertyValue,
} from "../lib/playground";
import { creationSvg } from "../lib/playground-export";

test("all 38 rounds have valid, distinct solutions and incomplete answers cannot win", () => {
  let count = 0;
  for (const game of Object.keys(gameRounds) as Array<keyof typeof gameRounds>)
    for (let index = 0; index < gameRounds[game].length; index++) {
      const session = newGameSession(game, index);
      if (game === "molecule") session.values = molecules[index].atoms.map((atom) => atom.z);
      if (game === "atom") session.values = [...atomTargets[index].values];
      if (game === "balance") session.values = [...equations[index].solution];
      if (game === "periodic") session.values = [...periodicHoles[index]];
      if (game === "detective") session.values = [...objects[index].answers];
      if (game === "mystery") session.choice = mysteryElements[index];
      if (game === "crystal") {
        session.crystal = gameRounds.crystal[index] as typeof session.crystal;
        session.units = 3;
      }
      if (game === "properties")
        session.values = [...propertyRounds[index].zs].sort(
          (a, b) => propertyValue(index, a) - propertyValue(index, b),
        );
      expect(checkGame(session).correct, `${game}:${index}`).toBe(true);
      expect(
        checkGame({
          ...session,
          values: session.values.length ? [] : session.values,
          choice: 0,
          units: 0,
        }).correct,
      ).toBe(false);
      count++;
    }
  expect(count).toBe(38);
});
test("stoichiometry conserves every element and rejects unsimplified multiples", () => {
  for (let index = 0; index < equations.length; index++) {
    const solution = equations[index].solution;
    expect(equationCounts(index, solution).every((row) => row.left === row.right)).toBe(true);
    const multiple = solution.map((n) => n * 2);
    expect(equationCounts(index, multiple).every((row) => row.left === row.right)).toBe(true);
    expect(checkGame({ ...newGameSession("balance", index), values: multiple }).message).toContain(
      "smallest",
    );
    const altered = [...solution];
    altered[0]++;
    expect(equationCounts(index, altered).some((row) => row.left !== row.right)).toBe(true);
  }
});
test("water, ammonia and methane preserve their actual three-dimensional angles", () => {
  for (const [index, expected] of [
    [0, 104.5],
    [2, 107],
    [3, 109.47],
  ]) {
    const molecule = molecules[index];
    const a = molecule.atoms[1].position.map((v, i) => v - molecule.atoms[0].position[i]);
    const b = molecule.atoms[2].position.map((v, i) => v - molecule.atoms[0].position[i]);
    const angle =
      (Math.acos(a.reduce((sum, v, i) => sum + v * b[i], 0) / Math.hypot(...a) / Math.hypot(...b)) *
        180) /
      Math.PI;
    expect(Math.abs(angle - expected)).toBeLessThan(0.15);
  }
  expect(molecules[1].bonds.every((b) => b.order === 2)).toBe(true);
  expect(molecules[5].bonds[0].order).toBe(3);
});
test("crystal cutaways have unique sites and physically meaningful neighbours", () => {
  const salt = crystalModel("salt", 3);
  expect(salt.bonds).toHaveLength(0); // Ionic neighbours are not represented as covalent sticks.
  for (const atom of salt.atoms) {
    const neighbours = salt.atoms.filter(
      (other) =>
        Math.abs(Math.hypot(...atom.position.map((v, i) => v - other.position[i])) - 0.8) < 0.001,
    );
    expect(neighbours.every((other) => other.z !== atom.z)).toBe(true);
  }
  for (const kind of ["diamond", "graphite"] as const) {
    const model = crystalModel(kind, 3);
    expect(
      new Set(model.atoms.map((atom) => atom.position.map((n) => n.toFixed(3)).join(","))).size,
    ).toBe(model.atoms.length);
    const degrees = model.atoms.map(
      (_, i) => model.bonds.filter((b) => b.a === i || b.b === i).length,
    );
    expect(Math.max(...degrees)).toBe(kind === "diamond" ? 4 : 3);
    if (kind === "graphite")
      expect(
        model.bonds.every((b) => model.atoms[b.a].position[2] === model.atoms[b.b].position[2]),
      ).toBe(true);
    expect(crystalModel(kind, 0).atoms.every((a) => a.ghost)).toBe(true);
    expect(crystalModel(kind, 1).atoms.some((a) => a.ghost)).toBe(true);
  }
});
test("saved-game normalization is safe and SVG titles cannot inject markup", () => {
  const clean = sanitizeGameSession({
    ...newGameSession("atom"),
    values: [-1, 300, 300],
    index: 99,
  });
  expect(clean).not.toBeNull();
  expect(normalizeSession(clean!).values).toEqual([1, 180, 118]);
  expect(
    normalizeSession({ ...newGameSession("properties"), values: [1, 1, 1, 1] }).values,
  ).toEqual(newGameSession("properties").values);
  expect(newGameSession("molecule", NaN).index).toBe(0);
  const session = { ...newGameSession("molecule"), values: [8, 1, 1] };
  const svg = creationSvg({
    id: "creation-safe",
    title: '<script>alert("x")</script>',
    at: 0,
    session,
  });
  expect(svg).not.toContain("<script>");
  expect(svg).toContain("&lt;script&gt;");
  expect(svg).toContain("not to scale");
  for (let index = 0; index < propertyRounds.length; index++)
    expect(propertyRounds[index].zs.every((z) => Number.isFinite(propertyValue(index, z)))).toBe(
      true,
    );
});
