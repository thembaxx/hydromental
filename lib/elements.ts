export type Category = "a" | "e" | "t" | "p" | "m" | "n" | "h" | "g" | "l" | "c";
export interface Element {
  z: number;
  s: string;
  n: string;
  m: string;
  c: Category;
  g: number;
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
const data = `H,Hydrogen,1.008,n,1,1,g
He,Helium,4.0026,g,18,1,g
Li,Lithium,6.94,a,1,2,s
Be,Beryllium,9.0122,e,2,2,s
B,Boron,10.81,m,13,2,s
C,Carbon,12.011,n,14,2,s
N,Nitrogen,14.007,n,15,2,g
O,Oxygen,15.999,n,16,2,g
F,Fluorine,18.998,h,17,2,g
Ne,Neon,20.180,g,18,2,g
Na,Sodium,22.990,a,1,3,s
Mg,Magnesium,24.305,e,2,3,s
Al,Aluminium,26.982,p,13,3,s
Si,Silicon,28.085,m,14,3,s
P,Phosphorus,30.974,n,15,3,s
S,Sulfur,32.06,n,16,3,s
Cl,Chlorine,35.45,h,17,3,g
Ar,Argon,39.948,g,18,3,g
K,Potassium,39.098,a,1,4,s
Ca,Calcium,40.078,e,2,4,s
Sc,Scandium,44.956,t,3,4,s
Ti,Titanium,47.867,t,4,4,s
V,Vanadium,50.942,t,5,4,s
Cr,Chromium,51.996,t,6,4,s
Mn,Manganese,54.938,t,7,4,s
Fe,Iron,55.845,t,8,4,s
Co,Cobalt,58.933,t,9,4,s
Ni,Nickel,58.693,t,10,4,s
Cu,Copper,63.546,t,11,4,s
Zn,Zinc,65.38,t,12,4,s
Ga,Gallium,69.723,p,13,4,s
Ge,Germanium,72.630,m,14,4,s
As,Arsenic,74.922,m,15,4,s
Se,Selenium,78.971,n,16,4,s
Br,Bromine,79.904,h,17,4,l
Kr,Krypton,83.798,g,18,4,g
Rb,Rubidium,85.468,a,1,5,s
Sr,Strontium,87.62,e,2,5,s
Y,Yttrium,88.906,t,3,5,s
Zr,Zirconium,91.224,t,4,5,s
Nb,Niobium,92.906,t,5,5,s
Mo,Molybdenum,95.95,t,6,5,s
Tc,Technetium,98,t,7,5,s
Ru,Ruthenium,101.07,t,8,5,s
Rh,Rhodium,102.91,t,9,5,s
Pd,Palladium,106.42,t,10,5,s
Ag,Silver,107.87,t,11,5,s
Cd,Cadmium,112.41,t,12,5,s
In,Indium,114.82,p,13,5,s
Sn,Tin,118.71,p,14,5,s
Sb,Antimony,121.76,m,15,5,s
Te,Tellurium,127.60,m,16,5,s
I,Iodine,126.90,h,17,5,s
Xe,Xenon,131.29,g,18,5,g
Cs,Caesium,132.91,a,1,6,s
Ba,Barium,137.33,e,2,6,s
La,Lanthanum,138.91,l,3,9,s
Ce,Cerium,140.12,l,4,9,s
Pr,Praseodymium,140.91,l,5,9,s
Nd,Neodymium,144.24,l,6,9,s
Pm,Promethium,145,l,7,9,s
Sm,Samarium,150.36,l,8,9,s
Eu,Europium,151.96,l,9,9,s
Gd,Gadolinium,157.25,l,10,9,s
Tb,Terbium,158.93,l,11,9,s
Dy,Dysprosium,162.50,l,12,9,s
Ho,Holmium,164.93,l,13,9,s
Er,Erbium,167.26,l,14,9,s
Tm,Thulium,168.93,l,15,9,s
Yb,Ytterbium,173.05,l,16,9,s
Lu,Lutetium,174.97,l,17,9,s
Hf,Hafnium,178.49,t,4,6,s
Ta,Tantalum,180.95,t,5,6,s
W,Tungsten,183.84,t,6,6,s
Re,Rhenium,186.21,t,7,6,s
Os,Osmium,190.23,t,8,6,s
Ir,Iridium,192.22,t,9,6,s
Pt,Platinum,195.08,t,10,6,s
Au,Gold,196.97,t,11,6,s
Hg,Mercury,200.59,t,12,6,l
Tl,Thallium,204.38,p,13,6,s
Pb,Lead,207.2,p,14,6,s
Bi,Bismuth,208.98,p,15,6,s
Po,Polonium,209,p,16,6,s
At,Astatine,210,h,17,6,s
Rn,Radon,222,g,18,6,g
Fr,Francium,223,a,1,7,s
Ra,Radium,226,e,2,7,s
Ac,Actinium,227,c,3,10,s
Th,Thorium,232.04,c,4,10,s
Pa,Protactinium,231.04,c,5,10,s
U,Uranium,238.03,c,6,10,s
Np,Neptunium,237,c,7,10,s
Pu,Plutonium,244,c,8,10,s
Am,Americium,243,c,9,10,s
Cm,Curium,247,c,10,10,s
Bk,Berkelium,247,c,11,10,s
Cf,Californium,251,c,12,10,s
Es,Einsteinium,252,c,13,10,s
Fm,Fermium,257,c,14,10,s
Md,Mendelevium,258,c,15,10,s
No,Nobelium,259,c,16,10,s
Lr,Lawrencium,266,c,17,10,s
Rf,Rutherfordium,267,t,4,7,u
Db,Dubnium,268,t,5,7,u
Sg,Seaborgium,269,t,6,7,u
Bh,Bohrium,270,t,7,7,u
Hs,Hassium,277,t,8,7,u
Mt,Meitnerium,278,t,9,7,u
Ds,Darmstadtium,281,t,10,7,u
Rg,Roentgenium,282,t,11,7,u
Cn,Copernicium,285,t,12,7,u
Nh,Nihonium,286,p,13,7,u
Fl,Flerovium,289,p,14,7,u
Mc,Moscovium,290,p,15,7,u
Lv,Livermorium,293,p,16,7,u
Ts,Tennessine,294,h,17,7,u
Og,Oganesson,294,g,18,7,u`;
export const elements: Element[] = data.split("\n").map((row, index) => {
  const [s, n, m, c, g, p, f] = row.split(",");
  return {
    z: index + 1,
    s,
    n,
    m,
    c: c as Category,
    g: Number(g),
    p: Number(p),
    f: f as Element["f"],
  };
});
export const period = (e: Element) => (e.c === "l" ? 6 : e.c === "c" ? 7 : e.p);
export const group = (e: Element) => (e.c === "l" || e.c === "c" ? "—" : e.g);
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
      ? e.g === current.g && (e.p - current.p) * sign > 0
      : e.p === current.p && (e.g - current.g) * sign > 0,
  );
  candidates.sort((a, b) =>
    vertical
      ? Math.abs(a.p - current.p) - Math.abs(b.p - current.p)
      : Math.abs(a.g - current.g) - Math.abs(b.g - current.g),
  );
  return candidates[0] ? candidates[0].z - 1 : null;
}
