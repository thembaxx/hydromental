import { categories, elements } from "./elements";
import { getScience } from "./science";
import { gameRounds, sanitizeGameSession, type GameId, type GameSession } from "./learning";

export const games: Array<{
  id: GameId;
  title: string;
  description: string;
  icon: "sandbox" | "spark" | "compare" | "table" | "search" | "help" | "spread" | "award";
}> = [
  {
    id: "molecule",
    title: "Molecule Builder",
    description: "Place atoms, snap bonds and build six familiar molecules.",
    icon: "sandbox",
  },
  {
    id: "atom",
    title: "Atom Workshop",
    description: "Change particles to explore elements, isotopes and ions.",
    icon: "spark",
  },
  {
    id: "balance",
    title: "Balance It",
    description: "Make every atom count on both sides of an equation.",
    icon: "compare",
  },
  {
    id: "periodic",
    title: "Periodic Puzzle",
    description: "Restore missing elements using their place in the table.",
    icon: "table",
  },
  {
    id: "detective",
    title: "Everyday Detective",
    description: "Find the elements inside a phone, bicycle and LED lamp.",
    icon: "search",
  },
  {
    id: "mystery",
    title: "Mystery Element",
    description: "Follow clues and solve the mystery with fewer hints.",
    icon: "help",
  },
  {
    id: "crystal",
    title: "Crystal Builder",
    description: "Assemble salt, diamond and graphite structures.",
    icon: "spread",
  },
  {
    id: "properties",
    title: "Property Challenge",
    description: "Put real element properties in order and learn why.",
    icon: "award",
  },
];
export type Position = [number, number, number];
export interface ModelAtom {
  z: number;
  position: Position;
  ghost?: boolean;
  kind?: "proton" | "neutron" | "electron";
}
export interface ModelBond {
  a: number;
  b: number;
  order?: number;
}
export interface Molecule {
  name: string;
  formula: string;
  atoms: ModelAtom[];
  bonds: ModelBond[];
  geometry: string;
  explanation: string;
  source: string;
}
const waterAngle = (52.25 * Math.PI) / 180;
export const molecules: Molecule[] = [
  {
    name: "Water",
    formula: "H₂O",
    atoms: [
      { z: 8, position: [0, 0.35, 0] },
      { z: 1, position: [-Math.sin(waterAngle) * 1.4, 0.35 - Math.cos(waterAngle) * 1.4, 0] },
      { z: 1, position: [Math.sin(waterAngle) * 1.4, 0.35 - Math.cos(waterAngle) * 1.4, 0] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
    ],
    geometry: "Bent · about 104.5°",
    explanation:
      "Two hydrogen atoms share electron pairs with oxygen. Water is bent; the oxygen's lone pairs affect its geometry. Bond lengths and atom sizes here are illustrative.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Water",
  },
  {
    name: "Carbon dioxide",
    formula: "CO₂",
    atoms: [
      { z: 6, position: [0, 0, 0] },
      { z: 8, position: [-1.5, 0, 0] },
      { z: 8, position: [1.5, 0, 0] },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
    geometry: "Linear · 180°",
    explanation:
      "One carbon atom forms two double bonds with oxygen. The molecule is linear; its shape differs from water even though both contain oxygen.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Carbon-dioxide",
  },
  {
    name: "Ammonia",
    formula: "NH₃",
    atoms: [
      { z: 7, position: [0, 0.35, 0] },
      ...[0, 1, 2].map((i) => ({
        z: 1,
        position: [
          Math.cos((i * Math.PI * 2) / 3) * 1.2,
          -0.131,
          Math.sin((i * Math.PI * 2) / 3) * 1.2,
        ] as Position,
      })),
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
    ],
    geometry: "Trigonal pyramidal · about 107°",
    explanation:
      "Three hydrogen atoms bond to nitrogen. Its lone pair contributes to a pyramidal arrangement; the molecule is not flat.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ammonia",
  },
  {
    name: "Methane",
    formula: "CH₄",
    atoms: [
      { z: 6, position: [0, 0, 0] },
      ...[
        [1, 1, 1],
        [-1, -1, 1],
        [-1, 1, -1],
        [1, -1, -1],
      ].map((v) => ({ z: 1, position: v.map((n) => n * 0.8) as Position })),
    ],
    bonds: [1, 2, 3, 4].map((b) => ({ a: 0, b })),
    geometry: "Tetrahedral · about 109.5°",
    explanation:
      "Four hydrogen atoms bond to carbon in a tetrahedral arrangement. A flat cross would hide this three-dimensional geometry.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Methane",
  },
  {
    name: "Oxygen molecule",
    formula: "O₂",
    atoms: [
      { z: 8, position: [-0.8, 0, 0] },
      { z: 8, position: [0.8, 0, 0] },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
    geometry: "Diatomic",
    explanation:
      "Ordinary oxygen gas contains pairs of oxygen atoms. The simplified bond-order model represents a double bond; it does not show molecular orbitals or oxygen's magnetism.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Oxygen",
  },
  {
    name: "Nitrogen molecule",
    formula: "N₂",
    atoms: [
      { z: 7, position: [-0.8, 0, 0] },
      { z: 7, position: [0.8, 0, 0] },
    ],
    bonds: [{ a: 0, b: 1, order: 3 }],
    geometry: "Diatomic",
    explanation:
      "Two nitrogen atoms form a strong triple bond. This explains why the abundant gas in air behaves differently from nitrogen in many compounds.",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Nitrogen",
  },
];
export const atomTargets = [
  {
    name: "Hydrogen-1",
    values: [1, 0, 1],
    description: "Build neutral hydrogen-1: one proton, no neutrons and one electron.",
  },
  {
    name: "Hydrogen-2",
    values: [1, 1, 1],
    description: "Build deuterium: the same element as hydrogen-1, with one extra neutron.",
  },
  {
    name: "Helium-4",
    values: [2, 2, 2],
    description: "Build neutral helium-4 with two protons, two neutrons and two electrons.",
  },
  {
    name: "Carbon-12",
    values: [6, 6, 6],
    description: "Build neutral carbon-12: six of each kind of particle.",
  },
  {
    name: "Sodium-23 ion",
    values: [11, 12, 10],
    description: "Build a sodium-23 ion with charge +1. It has lost one electron, not a proton.",
  },
  {
    name: "Chlorine-35 ion",
    values: [17, 18, 18],
    description: "Build a chlorine-35 ion with charge −1. It has gained one electron.",
  },
];
export const isotopeSource = "https://physics.nist.gov/PhysRefData/Compositions/index.html";
export const knownIsotopes: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
  3: [6, 7],
  6: [12, 13],
  7: [14, 15],
  8: [16, 17, 18],
  11: [23],
  12: [24, 25, 26],
  13: [27],
  14: [28, 29, 30],
  17: [35, 37],
  26: [54, 56, 57, 58],
  29: [63, 65],
  79: [197],
};
type Species = { label: string; atoms: Array<[number, number]> };
export const equations: Array<{
  name: string;
  left: Species[];
  right: Species[];
  solution: number[];
  explanation: string;
}> = [
  {
    name: "Make water",
    left: [
      { label: "H₂", atoms: [[1, 2]] },
      { label: "O₂", atoms: [[8, 2]] },
    ],
    right: [
      {
        label: "H₂O",
        atoms: [
          [1, 2],
          [8, 1],
        ],
      },
    ],
    solution: [2, 1, 2],
    explanation:
      "Two hydrogen molecules and one oxygen molecule account for the atoms in two water molecules. Coefficients change amounts; subscripts define each substance.",
  },
  {
    name: "Carbon monoxide to carbon dioxide",
    left: [
      {
        label: "CO",
        atoms: [
          [6, 1],
          [8, 1],
        ],
      },
      { label: "O₂", atoms: [[8, 2]] },
    ],
    right: [
      {
        label: "CO₂",
        atoms: [
          [6, 1],
          [8, 2],
        ],
      },
    ],
    solution: [2, 1, 2],
    explanation:
      "Two carbon monoxide molecules plus one oxygen molecule conserve two carbon atoms and four oxygen atoms in the products.",
  },
  {
    name: "Make ammonia",
    left: [
      { label: "N₂", atoms: [[7, 2]] },
      { label: "H₂", atoms: [[1, 2]] },
    ],
    right: [
      {
        label: "NH₃",
        atoms: [
          [7, 1],
          [1, 3],
        ],
      },
    ],
    solution: [1, 3, 2],
    explanation:
      "One nitrogen molecule and three hydrogen molecules account for the atoms in two ammonia molecules. The actual reaction is reversible.",
  },
  {
    name: "Methane and oxygen",
    left: [
      {
        label: "CH₄",
        atoms: [
          [6, 1],
          [1, 4],
        ],
      },
      { label: "O₂", atoms: [[8, 2]] },
    ],
    right: [
      {
        label: "CO₂",
        atoms: [
          [6, 1],
          [8, 2],
        ],
      },
      {
        label: "H₂O",
        atoms: [
          [1, 2],
          [8, 1],
        ],
      },
    ],
    solution: [1, 2, 1, 2],
    explanation:
      "One methane molecule has four hydrogen atoms, requiring two water molecules in this net equation. Four oxygen atoms are needed overall.",
  },
];
export function equationCounts(
  index: number,
  values: number[],
): Array<{ z: number; left: number; right: number }> {
  const equation = equations[index];
  const totals = new Map<number, { left: number; right: number }>();
  [...equation.left, ...equation.right].forEach((species, i) =>
    species.atoms.forEach(([z, count]) => {
      const item = totals.get(z) ?? { left: 0, right: 0 };
      item[i < equation.left.length ? "left" : "right"] += count * (values[i] ?? 1);
      totals.set(z, item);
    }),
  );
  return [...totals].map(([z, counts]) => ({ z, ...counts }));
}
export const periodicHoles = [
  [1, 2, 10, 18],
  [3, 11, 12, 13],
  [6, 7, 8, 9],
  [4, 12, 9, 17],
];
export const objects = [
  {
    name: "Inside a phone",
    kind: "phone",
    parts: ["Processor", "Wiring", "Rechargeable battery", "Speaker magnet"],
    answers: [14, 29, 3, 60],
    explanations: [
      "Silicon is central to many semiconductor chips.",
      "Copper carries electrical signals through much of a phone's circuitry.",
      "Lithium ions move between materials in common rechargeable phone batteries; the battery does not contain a lump of pure lithium.",
      "Many small speakers use neodymium-containing magnets, usually with iron and boron.",
    ],
    choices: [3, 14, 29, 60, 8, 7],
  },
  {
    name: "Inside a bicycle",
    kind: "bicycle",
    parts: ["Aluminium frame", "Steel chain", "Rubber tyre", "Brass bell"],
    answers: [13, 26, 6, 29],
    explanations: [
      "Many lightweight frames use aluminium alloys; bicycles also use steel, titanium and carbon composites.",
      "Steel is an iron-based alloy, commonly used for chains.",
      "Carbon is present in rubber polymers and in carbon black used in many tyres.",
      "Brass contains copper and zinc. Bell materials vary; this example is brass.",
    ],
    choices: [13, 26, 6, 29, 79, 2],
  },
  {
    name: "Inside a white LED lamp",
    kind: "led",
    parts: [
      "Blue-emitting semiconductor",
      "Heat sink",
      "Electrical wiring",
      "Yttrium-based phosphor",
    ],
    answers: [31, 13, 29, 39],
    explanations: [
      "Many blue LEDs use gallium nitride, a compound containing gallium and nitrogen.",
      "Aluminium is common in heat sinks because it conducts heat and is light.",
      "Copper is a common conductor in wiring.",
      "Many white LEDs use a yttrium aluminium garnet phosphor doped with cerium. White-light technologies vary.",
    ],
    choices: [31, 13, 29, 39, 8, 11],
  },
];
export const mysteryElements = [1, 8, 26, 29, 2, 14, 10, 79];
export function mysteryClues(index: number): string[] {
  const element = elements[mysteryElements[index] - 1];
  return [
    `I belong to the ${categories[element.c][0].toLowerCase()} family.`,
    `I am in period ${element.p}, group ${element.g}.`,
    `My standard atomic mass is approximately ${element.m} u.`,
    `My atomic number is ${element.z}.`,
  ];
}
export const propertyRounds = [
  {
    name: "Atomic mass",
    zs: [1, 6, 8, 26],
    unit: "u",
    explanation:
      "Atomic mass generally increases across these examples. Atomic number counts protons; atomic mass also reflects neutrons and isotopic abundance.",
  },
  {
    name: "Melting point",
    zs: [11, 12, 13, 14],
    unit: "K",
    explanation:
      "These selected reference values reflect different bonding and structures. Periodic trends have exceptions; use the data rather than assuming atomic-number order.",
  },
  {
    name: "Electronegativity",
    zs: [11, 14, 17, 9],
    unit: "Pauling scale",
    explanation:
      "Electronegativity describes attraction for bonding electrons. It tends to increase across a period, but the scale and chemical context matter.",
  },
  {
    name: "Density",
    zs: [13, 26, 29, 79],
    unit: "g/cm³",
    explanation:
      "These are selected tabulated densities of solids. Density depends on temperature, phase and structure; these values are not a universal ranking across every condition.",
  },
];
export function propertyValue(index: number, z: number): number {
  return Number(
    getScience(z).properties.find((p) => p.label === propertyRounds[index].name)?.value,
  );
}
export function newGameSession(game: GameId, index = 0, free = false, daily = ""): GameSession {
  const count = gameRounds[game].length;
  index = Number.isFinite(index) ? Math.max(0, Math.min(count - 1, Math.floor(index))) : 0;
  const values =
    game === "molecule"
      ? molecules[index].atoms.map(() => -1)
      : game === "atom"
        ? [1, 0, 1]
        : game === "balance"
          ? [...equations[index].left, ...equations[index].right].map(() => 1)
          : game === "periodic"
            ? periodicHoles[index].map(() => -1)
            : game === "detective"
              ? objects[index].answers.map(() => -1)
              : game === "properties"
                ? [2, 0, 3, 1].map((i) => propertyRounds[index].zs[i])
                : [];
  return {
    game,
    index,
    free,
    daily,
    values,
    choice: 0,
    hints: 0,
    crystal: "salt",
    units: 0,
    timed: false,
    elapsed: 0,
  };
}
export function normalizeSession(session: GameSession): GameSession {
  session = sanitizeGameSession(session) ?? newGameSession("molecule");
  const base = newGameSession(session.game, session.index, session.free, session.daily);
  const values = session.values.slice(0, base.values.length);
  if (values.length !== base.values.length) return { ...session, values: base.values };
  if (session.game === "atom")
    return {
      ...session,
      values: [
        Math.max(1, Math.min(118, values[0])),
        Math.max(0, Math.min(180, values[1])),
        Math.max(0, Math.min(118, values[2])),
      ],
    };
  if (session.game === "balance")
    return { ...session, values: values.map((v) => Math.max(1, Math.min(9, v))) };
  if (
    session.game === "properties" &&
    (new Set(values).size !== 4 ||
      !values.every((z) => propertyRounds[session.index].zs.includes(z)))
  )
    return { ...session, values: base.values };
  return { ...session, values: values.map((v) => (v >= 1 && v <= 118 ? v : -1)) };
}
export function checkGame(session: GameSession): { correct: boolean; message: string } {
  const { game, index, values } = session;
  if (
    !gameRounds[game] ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= gameRounds[game].length ||
    values.length !== newGameSession(game, index).values.length ||
    !values.every(Number.isInteger)
  )
    return { correct: false, message: "Reset this round to restore a valid game state." };
  let correct = false;
  let message = "";
  if (game === "molecule") {
    correct = molecules[index].atoms.every((atom, i) => atom.z === values[i]);
    message = correct
      ? molecules[index].explanation
      : "Check the atom count and central atom. Select an ingredient and tap a position; you can remove an atom and try again.";
  }
  if (game === "atom") {
    correct = values.every((v, i) => v === atomTargets[index].values[i]);
    message = correct
      ? "Protons identify the element; neutrons determine its isotope; electrons determine its charge. Changing electrons does not change the element."
      : atomTargets[index].description;
  }
  if (game === "balance") {
    correct =
      equationCounts(index, values).every((row) => row.left === row.right) &&
      values.every((v, i) => v === equations[index].solution[i]);
    message = correct
      ? equations[index].explanation
      : equationCounts(index, values).every((row) => row.left === row.right)
        ? "The atoms balance. Reduce the coefficients to the smallest whole-number ratio."
        : "Compare the atom counters on both sides. Change coefficients, not the formulas' subscripts.";
  }
  if (game === "periodic") {
    correct = periodicHoles[index].every((z, i) => values[i] === z);
    message = correct
      ? "Each element has one unique atomic number. Its group and period connect it to its neighbours."
      : "Use the empty tile's period and group. Choose an element, then tap its position in the table.";
  }
  if (game === "detective") {
    correct = objects[index].answers.every((z, i) => values[i] === z);
    message = correct
      ? "Case solved. These are common material examples; real products vary and often contain compounds or alloys."
      : "Choose a part of the object, then choose its element. The material hints explain how the element is used.";
  }
  if (game === "mystery") {
    correct = session.choice === mysteryElements[index];
    message = correct
      ? `${elements[session.choice - 1].n} is the mystery element. You used ${session.hints + 1} of four clues.`
      : "That element does not match all the clues. Try another choice, or reveal a hint.";
  }
  if (game === "crystal") {
    correct = session.crystal === gameRounds.crystal[index] && session.units === 3;
    message = correct
      ? crystalInfo[session.crystal].explanation
      : "Choose the structure that fits the clue and add all three sections. Arrangement matters as much as the ingredients.";
  }
  if (game === "properties") {
    correct =
      values.length === 4 &&
      new Set(values).size === 4 &&
      values.every((z) => propertyRounds[index].zs.includes(z)) &&
      values.every((z, i) => !i || propertyValue(index, values[i - 1]) <= propertyValue(index, z));
    message = correct
      ? propertyRounds[index].explanation
      : "Arrange all four elements from the smallest value to the largest. Use a hint to reveal one comparison.";
  }
  return { correct, message };
}
export const crystalInfo = {
  salt: {
    title: "Sodium chloride",
    clue: "Build a structure with alternating oppositely charged ions.",
    explanation:
      "Sodium chloride is an extended ionic lattice. Interior ions have six nearest neighbours of opposite charge. This finite cutaway omits boundary neighbours and does not show isolated NaCl molecules.",
  },
  diamond: {
    title: "Diamond",
    clue: "Build a carbon network with tetrahedral bonding.",
    explanation:
      "Diamond has a three-dimensional carbon network. Interior carbon atoms bond to four neighbours. Bonds at this small cutaway's edges continue into the surrounding crystal.",
  },
  graphite: {
    title: "Graphite",
    clue: "Build a carbon structure with sheets that can slide over each other.",
    explanation:
      "Graphite contains stacked sheets of carbon, with three covalently bonded neighbours per interior atom. The weak interlayer interaction is distinct from the bonds within a sheet; this model exaggerates layer spacing.",
  },
};
export function crystalModel(
  kind: GameSession["crystal"],
  units: number,
): { atoms: ModelAtom[]; bonds: ModelBond[] } {
  const atoms: ModelAtom[] = [];
  if (kind === "salt")
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 3; y++)
        for (let z = 0; z < 3; z++)
          atoms.push({
            z: (x + y + z) % 2 ? 17 : 11,
            position: [(x - 1.5) * 0.8, (y - 1) * 0.8, (z - 1) * 0.8],
          });
  if (kind === "diamond")
    for (let cell = 0; cell < 3; cell++)
      for (const point of [
        [0, 0, 0],
        [0, 0.5, 0.5],
        [0.5, 0, 0.5],
        [0.5, 0.5, 0],
        [0.25, 0.25, 0.25],
        [0.25, 0.75, 0.75],
        [0.75, 0.25, 0.75],
        [0.75, 0.75, 0.25],
      ])
        atoms.push({
          z: 6,
          position: [
            (point[0] + cell - 1.25) * 1.5,
            (point[1] - 0.375) * 1.5,
            (point[2] - 0.375) * 1.5,
          ],
        });
  if (kind === "graphite") {
    const seen = new Set<string>();
    for (let layer = 0; layer < 2; layer++)
      for (let cell = 0; cell < 3; cell++)
        for (let point = 0; point < 6; point++) {
          const x =
            (cell - 1) * Math.sqrt(3) * 0.7 +
            Math.cos(Math.PI / 6 + (point * Math.PI) / 3) * 0.7 +
            layer * Math.sqrt(3) * 0.35;
          const y = Math.sin(Math.PI / 6 + (point * Math.PI) / 3) * 0.7 + layer * 0.35;
          const position: Position = [x, y, (layer - 0.5) * 1.3];
          const key = position.map((v) => (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3)).join(",");
          if (!seen.has(key)) {
            seen.add(key);
            atoms.push({ z: 6, position });
          }
        }
  }
  const visible = Math.ceil((atoms.length * units) / 3);
  const bonds: ModelBond[] = [];
  for (let a = 0; a < visible; a++)
    for (let b = a + 1; b < visible; b++) {
      const distance = Math.hypot(...atoms[a].position.map((v, i) => v - atoms[b].position[i]));
      if (
        (kind === "diamond" && Math.abs(distance - Math.sqrt(3) * 0.25 * 1.5) < 0.03) ||
        (kind === "graphite" &&
          Math.abs(atoms[a].position[2] - atoms[b].position[2]) < 0.01 &&
          Math.abs(distance - 0.7) < 0.03)
      )
        bonds.push({ a, b });
    }
  return { atoms: atoms.map((atom, i) => ({ ...atom, ghost: i >= visible })), bonds };
}
export function sessionModel(
  session: Pick<GameSession, "game" | "index" | "values" | "crystal" | "units">,
): {
  atoms: ModelAtom[];
  bonds: ModelBond[];
  title: string;
  note: string;
} {
  if (session.game === "molecule") {
    const model = molecules[session.index];
    return {
      atoms: model.atoms.map((atom, i) => ({
        ...atom,
        z: session.values[i] > 0 ? session.values[i] : atom.z,
        ghost: session.values[i] < 1,
      })),
      bonds: model.bonds.filter((bond) => session.values[bond.a] > 0 && session.values[bond.b] > 0),
      title: `${model.name} · ${model.formula}`,
      note: model.geometry,
    };
  }
  if (session.game === "crystal")
    return {
      ...crystalModel(session.crystal, session.units),
      title: crystalInfo[session.crystal].title,
      note: "Finite cutaway · sizes and distances are illustrative",
    };
  const [p, n, e] = session.values;
  const atoms: ModelAtom[] = [];
  for (const [kind, count] of [
    ["proton", p],
    ["neutron", n],
    ["electron", e],
  ] as const)
    for (let i = 0; i < Math.min(count, 18); i++) {
      const angle = i * 2.399963 + (kind === "neutron" ? 1.1 : 0);
      atoms.push({
        z: kind === "electron" ? 0 : p,
        kind,
        position:
          kind === "electron"
            ? [Math.cos(angle) * 1.7, Math.sin(angle) * 1.3, Math.sin(angle * 1.7) * 0.35]
            : [
                Math.cos(angle) * (0.18 + i * 0.02),
                Math.sin(angle) * (0.18 + i * 0.02),
                Math.cos(angle * 1.7) * 0.35,
              ],
      });
    }
  return {
    atoms,
    bonds: [],
    title: `${elements[p - 1].n}-${p + n} · charge ${p - e > 0 ? "+" : ""}${p - e}`,
    note: "Representative particle dots · exact counts in the controls · not quantum orbitals",
  };
}
