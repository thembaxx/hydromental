export const auras = [
  {
    id: "hydro",
    name: "Hydro",
    nature: "Find your flow",
    color: "#73e2cd",
    ink: "#26665b",
    secondary: "#128f85",
    label: "Water",
    description: "Quiet currents. Endless curiosity.",
  },
  {
    id: "ember",
    name: "Ember",
    nature: "Feed the spark",
    color: "#ff9d75",
    ink: "#984529",
    secondary: "#c73916",
    label: "Fire",
    description: "A little spark changes everything.",
  },
  {
    id: "solar",
    name: "Solar",
    nature: "Follow the light",
    color: "#efcf7b",
    ink: "#76530f",
    secondary: "#a56f17",
    label: "Light",
    description: "There is wonder in every wavelength.",
  },
  {
    id: "breeze",
    name: "Breeze",
    nature: "Make some space",
    color: "#b3b4f7",
    ink: "#5558a1",
    secondary: "#6669b8",
    label: "Air",
    description: "Let your imagination wander.",
  },
] as const;
export type Aura = (typeof auras)[number];
export type ElementalSceneApi = {
  inspect: (x: number, y: number) => import("./atom-scene").AtomInspection | null;
  resetCamera: () => void;
};
