export interface AtomInspectionFrame {
  progress: number;
  nucleusSpread: number;
  shellOpacity: number;
  cloudOpacity: number;
  shells: Array<{
    index: number;
    radiusScale: number;
    offset: number;
    opacity: number;
  }>;
}

/**
 * Pure timeline sampler for educational atom teardown. It is deterministic:
 * the same progress and shell count always produce the same inspection frame.
 * It intentionally visualises a teaching model, not literal orbital
 * trajectories.
 */
export function sampleAtomInspection(
  progress: number,
  shellCount: number,
): AtomInspectionFrame {
  const amount = Math.max(
    0,
    Math.min(1, Number.isFinite(progress) ? progress : 0),
  );
  const count = Math.max(
    0,
    Math.min(7, Math.floor(Number.isFinite(shellCount) ? shellCount : 0)),
  );
  const eased = amount * amount * (3 - 2 * amount);
  return {
    progress: amount,
    nucleusSpread: 1 + eased * 1.9,
    shellOpacity: 1 - eased * 0.82,
    cloudOpacity: 1 - eased,
    shells: Array.from({ length: count }, (_, index) => {
      const normalized = count <= 1 ? 0 : index / (count - 1);
      return {
        index,
        radiusScale: 1 + eased * (0.08 + normalized * 0.28),
        offset: eased * (0.12 + normalized * 0.52),
        opacity: 1 - eased * (0.08 + normalized * 0.34),
      };
    }),
  };
}

/** Maps a UI scrub position to a named educational sequence. */
export function atomInspectionLabel(progress: number): string {
  const amount = Math.max(
    0,
    Math.min(1, Number.isFinite(progress) ? progress : 0),
  );
  if (amount < 0.2) return 'assembled atom';
  if (amount < 0.48) return 'electron shells separated';
  if (amount < 0.78) return 'electron clouds isolated';
  return 'nucleus exposed';
}
