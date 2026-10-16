export type VisualMode = "bohr" | "cloud" | "matter";
export type MatterPhase = "solid" | "liquid" | "gas" | "unknown";

/** Prefer the evaluated representative isotope, then the most abundant natural one. */
export function representativeMassNumber(
  isotopes: readonly {
    massNumber: number;
    abundance: string | null;
    representative: boolean;
  }[],
  atomicNumber: number,
) {
  const representative = isotopes.find((isotope) => isotope.representative);
  if (representative) return representative.massNumber;
  const abundant = isotopes.reduce<(typeof isotopes)[number] | undefined>(
    (best, isotope) =>
      Number.parseFloat(isotope.abundance ?? "0") > Number.parseFloat(best?.abundance ?? "0")
        ? isotope
        : best,
    isotopes[0],
  );
  return abundant?.massNumber ?? atomicNumber;
}

/** Seeded, decorrelated sampling keeps the full cloud stable across renders. */
export function cloudPositions(atomicNumber: number, shellCount: number, count = 1200) {
  let seed = atomicNumber * 7919;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const azimuth = random() * Math.PI * 2;
    const cosine = random() * 2 - 1;
    const sine = Math.sqrt(1 - cosine * cosine);
    // A radial density illustration, deliberately not a computed orbital solution.
    const radius = Math.min(
      3.2,
      -Math.log(random() * random() * random()) * (0.14 + shellCount * 0.025),
    );
    positions.set(
      [radius * sine * Math.cos(azimuth), radius * cosine, radius * sine * Math.sin(azimuth)],
      i * 3,
    );
  }
  return positions;
}

export function matterPhase(phase: "s" | "l" | "g" | "u"): MatterPhase {
  return ({ s: "solid", l: "liquid", g: "gas", u: "unknown" } as const)[phase];
}
