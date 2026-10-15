import snapshot from "./science-data.json";

export type Category = "a" | "e" | "t" | "p" | "m" | "n" | "h" | "g" | "l" | "c";
export interface Element {
  z: number;
  s: string;
  n: string;
  m: string;
  c: Category;
  g: number | null;
  gridColumn: number;
  gridRow: number;
  massUnit?: string;
  massLabel: string;
  phaseLabel: string;
  p: number;
  f: "s" | "l" | "g" | "u";
}
export const categories: Record<Category, readonly [string, string]> = {
  a: ["Alkali metal", "#FF5A5F"],
  e: ["Alkaline earth", "#FF9F43"],
  t: ["Transition metal", "#FFD23F"],
  p: ["Post-transition", "#2ED8A3"],
  m: ["Metalloid", "#20C5E8"],
  n: ["Nonmetal", "#4D8DFF"],
  h: ["Halogen", "#9B6BFF"],
  g: ["Noble gas", "#FF6BD6"],
  l: ["Lanthanide", "#A3E635"],
  c: ["Actinide", "#FB7185"],
};
export const phases = { s: "Solid", l: "Liquid", g: "Gas", u: "Unknown" };
const data = `H,Hydrogen,n,1,1
He,Helium,g,18,1
Li,Lithium,a,1,2
Be,Beryllium,e,2,2
B,Boron,m,13,2
C,Carbon,n,14,2
N,Nitrogen,n,15,2
O,Oxygen,n,16,2
F,Fluorine,h,17,2
Ne,Neon,g,18,2
Na,Sodium,a,1,3
Mg,Magnesium,e,2,3
Al,Aluminium,p,13,3
Si,Silicon,m,14,3
P,Phosphorus,n,15,3
S,Sulfur,n,16,3
Cl,Chlorine,h,17,3
Ar,Argon,g,18,3
K,Potassium,a,1,4
Ca,Calcium,e,2,4
Sc,Scandium,t,3,4
Ti,Titanium,t,4,4
V,Vanadium,t,5,4
Cr,Chromium,t,6,4
Mn,Manganese,t,7,4
Fe,Iron,t,8,4
Co,Cobalt,t,9,4
Ni,Nickel,t,10,4
Cu,Copper,t,11,4
Zn,Zinc,t,12,4
Ga,Gallium,p,13,4
Ge,Germanium,m,14,4
As,Arsenic,m,15,4
Se,Selenium,n,16,4
Br,Bromine,h,17,4
Kr,Krypton,g,18,4
Rb,Rubidium,a,1,5
Sr,Strontium,e,2,5
Y,Yttrium,t,3,5
Zr,Zirconium,t,4,5
Nb,Niobium,t,5,5
Mo,Molybdenum,t,6,5
Tc,Technetium,t,7,5
Ru,Ruthenium,t,8,5
Rh,Rhodium,t,9,5
Pd,Palladium,t,10,5
Ag,Silver,t,11,5
Cd,Cadmium,t,12,5
In,Indium,p,13,5
Sn,Tin,p,14,5
Sb,Antimony,m,15,5
Te,Tellurium,m,16,5
I,Iodine,h,17,5
Xe,Xenon,g,18,5
Cs,Caesium,a,1,6
Ba,Barium,e,2,6
La,Lanthanum,l,3,9
Ce,Cerium,l,4,9
Pr,Praseodymium,l,5,9
Nd,Neodymium,l,6,9
Pm,Promethium,l,7,9
Sm,Samarium,l,8,9
Eu,Europium,l,9,9
Gd,Gadolinium,l,10,9
Tb,Terbium,l,11,9
Dy,Dysprosium,l,12,9
Ho,Holmium,l,13,9
Er,Erbium,l,14,9
Tm,Thulium,l,15,9
Yb,Ytterbium,l,16,9
Lu,Lutetium,l,17,9
Hf,Hafnium,t,4,6
Ta,Tantalum,t,5,6
W,Tungsten,t,6,6
Re,Rhenium,t,7,6
Os,Osmium,t,8,6
Ir,Iridium,t,9,6
Pt,Platinum,t,10,6
Au,Gold,t,11,6
Hg,Mercury,t,12,6
Tl,Thallium,p,13,6
Pb,Lead,p,14,6
Bi,Bismuth,p,15,6
Po,Polonium,p,16,6
At,Astatine,h,17,6
Rn,Radon,g,18,6
Fr,Francium,a,1,7
Ra,Radium,e,2,7
Ac,Actinium,c,3,10
Th,Thorium,c,4,10
Pa,Protactinium,c,5,10
U,Uranium,c,6,10
Np,Neptunium,c,7,10
Pu,Plutonium,c,8,10
Am,Americium,c,9,10
Cm,Curium,c,10,10
Bk,Berkelium,c,11,10
Cf,Californium,c,12,10
Es,Einsteinium,c,13,10
Fm,Fermium,c,14,10
Md,Mendelevium,c,15,10
No,Nobelium,c,16,10
Lr,Lawrencium,c,17,10
Rf,Rutherfordium,t,4,7
Db,Dubnium,t,5,7
Sg,Seaborgium,t,6,7
Bh,Bohrium,t,7,7
Hs,Hassium,t,8,7
Mt,Meitnerium,t,9,7
Ds,Darmstadtium,t,10,7
Rg,Roentgenium,t,11,7
Cn,Copernicium,t,12,7
Nh,Nihonium,p,13,7
Fl,Flerovium,p,14,7
Mc,Moscovium,p,15,7
Lv,Livermorium,p,16,7
Ts,Tennessine,h,17,7
Og,Oganesson,g,18,7`;
export const elements: Element[] = data.split("\n").map((row, index) => {
  const [s, n, c, gridColumn, gridRow] = row.split(",");
  const record = snapshot.records[index];
  const mass = record.properties.find((property) => property.label === "Atomic mass")!;
  const state = record.properties.find((property) => property.label === "Standard state")!;
  const phase = /solid/i.test(state.value)
    ? "s"
    : /liquid/i.test(state.value)
      ? "l"
      : /gas/i.test(state.value)
        ? "g"
        : "u";
  return {
    z: index + 1,
    s,
    n,
    m: mass.value,
    massUnit: "unit" in mass ? mass.unit : undefined,
    massLabel: "displayLabel" in mass ? mass.displayLabel! : mass.label,
    phaseLabel: state.value,
    c: c as Category,
    g: c === "l" || c === "c" ? null : Number(gridColumn),
    p: c === "l" ? 6 : c === "c" ? 7 : Number(gridRow),
    gridColumn: Number(gridColumn),
    gridRow: Number(gridRow),
    f: phase,
  };
});
export const period = (e: Element) => e.p;
export const group = (e: Element) => e.g ?? "—";
export function electronShells(z: number) {
  const orbitals = [
    [1, 2],
    [2, 2],
    [2, 6],
    [3, 2],
    [3, 6],
    [4, 2],
    [3, 10],
    [4, 6],
    [5, 2],
    [4, 10],
    [5, 6],
    [6, 2],
    [4, 14],
    [5, 10],
    [6, 6],
    [7, 2],
    [5, 14],
    [6, 10],
    [7, 6],
  ];
  const shells: number[] = [];
  for (const [n, capacity] of orbitals) {
    if (z <= 0) break;
    const count = Math.min(z, capacity);
    shells[n - 1] = (shells[n - 1] ?? 0) + count;
    z -= count;
  }
  return shells;
}
export function neighbour(index: number, direction: "u" | "d" | "l" | "r") {
  const current = elements[index];
  const vertical = direction === "u" || direction === "d";
  const sign = direction === "d" || direction === "r" ? 1 : -1;
  const candidates = elements.filter((e) =>
    vertical
      ? e.gridColumn === current.gridColumn && (e.gridRow - current.gridRow) * sign > 0
      : e.gridRow === current.gridRow && (e.gridColumn - current.gridColumn) * sign > 0,
  );
  candidates.sort((a, b) =>
    vertical
      ? Math.abs(a.gridRow - current.gridRow) - Math.abs(b.gridRow - current.gridRow)
      : Math.abs(a.gridColumn - current.gridColumn) - Math.abs(b.gridColumn - current.gridColumn),
  );
  return candidates[0] ? candidates[0].z - 1 : null;
}
