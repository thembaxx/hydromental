export type ExampleElement = { symbol: string; name: string; protons: number };
export const EXAMPLE_ELEMENTS: readonly ExampleElement[] = [
  { symbol: "Li", name: "Lithium", protons: 3 },
  { symbol: "C", name: "Carbon", protons: 6 },
  { symbol: "O", name: "Oxygen", protons: 8 },
];
/** Charge is measured in elementary charge units: protons minus electrons. */
export function ionCharge(protons: number, electrons: number): number {
  if (!Number.isInteger(protons) || !Number.isInteger(electrons) || protons < 1 || electrons < 0)
    throw new RangeError("Invalid atom composition");
  return protons - electrons;
}
/** A deliberately limited Bohr-style teaching diagram for the selected light elements. */
export function simpleShells(electrons: number): number[] {
  if (!Number.isInteger(electrons) || electrons < 0 || electrons > 10)
    throw new RangeError("This diagram supports 0–10 electrons");
  return [Math.min(2, electrons), Math.min(8, Math.max(0, electrons - 2))];
}
export function chargeText(charge: number): string {
  return charge === 0 ? "Neutral" : charge > 0 ? "+" + charge + " positive" : Math.abs(charge) + " negative";
}
