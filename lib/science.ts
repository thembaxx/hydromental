import { elements, type Element } from "./elements";
import snapshot from "./science-data.json";

export interface ScienceRecord {
  atomicNumber: number;
  configuration: string;
  configurationNote: string;
  shells: number[];
  description: string;
  story: string;
  everyday: string;
  fact: string;
  connection: { atomicNumber: number; explanation: string };
  properties: Array<{ label: string; value: string; unit?: string; note?: string }>;
  sources: Array<{ label: string; url: string }>;
}

export interface Expedition {
  id: string;
  title: string;
  description: string;
  atomicNumbers: number[];
}

export interface SandboxRecipe {
  id: string;
  title: string;
  formula: string;
  atomicNumbers: number[];
  explanation: string;
}

export const scienceRecords: readonly ScienceRecord[] = snapshot.records;
export const scienceMetadata = {
  retrievedAt: snapshot.retrievedAt,
  source: snapshot.source,
  modelNote:
    "Orbiting dots illustrate electron counts by principal shell. Electrons occupy quantum states, rather than travelling along fixed planetary paths. The scientific view is a labeled schematic, not a probability-density simulation.",
};

export function getScience(z: number): ScienceRecord {
  if (!Number.isInteger(z) || z < 1 || z > scienceRecords.length) {
    throw new RangeError("Atomic number must be an integer between 1 and 118.");
  }
  return scienceRecords[z - 1];
}

export function elementSlug(element: Element): string {
  return element.n.toLowerCase();
}

export function findElementBySlug(slug: string): Element | undefined {
  const normalized = slug.toLowerCase();
  const aliases: Record<string, string> = {
    aluminum: "aluminium",
    cesium: "caesium",
    sulphur: "sulfur",
  };
  const canonical = aliases[normalized] ?? normalized;
  return elements.find((element) => elementSlug(element) === canonical);
}

export const expeditions: Expedition[] = [
  {
    id: "phone",
    title: "Inside your phone",
    description:
      "Follow the atoms behind chips, batteries, touchscreens and tiny speakers. Materials vary between devices; this trail highlights common examples.",
    atomicNumbers: [14, 3, 27, 29, 49, 50, 60, 26, 5, 79],
  },
  {
    id: "body",
    title: "A universe inside you",
    description:
      "Meet the elements in water, proteins, bones and the signals between cells. Elemental forms and biological compounds behave differently.",
    atomicNumbers: [1, 8, 6, 7, 20, 15, 11, 19, 12, 16, 26, 53],
  },
  {
    id: "cosmos",
    title: "Written in the stars",
    description:
      "Travel from abundant hydrogen and helium to heavier elements made through stellar and other cosmic processes.",
    atomicNumbers: [1, 2, 6, 7, 8, 10, 12, 14, 26, 79],
  },
  {
    id: "earth",
    title: "Under your feet",
    description:
      "Find the elements in rocks, sand, limestone and the metals that shape our planet.",
    atomicNumbers: [8, 14, 13, 26, 20, 11, 19, 12, 6, 16],
  },
  {
    id: "light",
    title: "A trail of colour",
    description:
      "Explore how different gases and compounds produce familiar colours in lamps, phosphors and luminous materials.",
    atomicNumbers: [10, 18, 36, 54, 38, 63, 65, 68],
  },
  {
    id: "magnets",
    title: "Invisible forces",
    description:
      "Discover the elements behind ordinary and powerful permanent magnets, and how alloying changes their behaviour.",
    atomicNumbers: [26, 27, 28, 60, 5, 62, 66],
  },
];

export const sandboxRecipes: SandboxRecipe[] = [
  {
    id: "water",
    title: "Water, a new identity",
    formula: "2H₂ + O₂ → 2H₂O",
    atomicNumbers: [1, 8],
    explanation:
      "In each water molecule, two hydrogen atoms share electrons with one oxygen atom. The balanced equation conserves atoms; the product has different properties from the elemental gases. This is a molecular illustration, not an experiment guide.",
  },
  {
    id: "salt",
    title: "A partnership of ions",
    formula: "2Na + Cl₂ → 2NaCl",
    atomicNumbers: [11, 17],
    explanation:
      "The simplified model transfers an electron from sodium to chlorine. Oppositely charged ions form an extended crystal lattice, rather than isolated NaCl molecules. The resulting compound behaves very differently from the pure elements.",
  },
  {
    id: "carbon-dioxide",
    title: "Carbon joins the air",
    formula: "C + O₂ → CO₂",
    atomicNumbers: [6, 8],
    explanation:
      "A carbon dioxide molecule contains one carbon atom and two oxygen atoms in a linear arrangement. This net equation is an example of atom conservation; the real chemistry depends on the reactants and conditions.",
  },
  {
    id: "silica",
    title: "From atoms to a network",
    formula: "SiO₂",
    atomicNumbers: [14, 8],
    explanation:
      "Silica has an overall ratio of one silicon atom to two oxygen atoms. Quartz is an extended network of connected units, rather than a collection of small SiO₂ molecules. Glass can contain silica alongside other ingredients.",
  },
  {
    id: "ammonia",
    title: "Nitrogen finds a partner",
    formula: "N₂ + 3H₂ ⇌ 2NH₃",
    atomicNumbers: [7, 1],
    explanation:
      "An ammonia molecule has one nitrogen atom bonded to three hydrogen atoms. The balanced reversible equation illustrates the basis of an important fertiliser-production process; the sandbox omits practical operating conditions.",
  },
  {
    id: "bronze",
    title: "An alloy, not a molecule",
    formula: "Cu + Sn → bronze alloy",
    atomicNumbers: [29, 50],
    explanation:
      "Bronze is a family of copper-based alloys that commonly contain tin. Alloy composition varies, so there is no single bronze molecular formula or fixed balanced reaction. Combining metals changes properties such as hardness.",
  },
  {
    id: "neodymium-magnet",
    title: "Small magnet, strong effect",
    formula: "Nd₂Fe₁₄B",
    atomicNumbers: [60, 26, 5],
    explanation:
      "The magnetic crystal phase in many neodymium magnets contains neodymium, iron and boron in this ratio. Its collective magnetic behaviour comes from its structure, rather than an isolated three-element molecule. Real magnet materials can include other ingredients.",
  },
];
