import { expect, test } from "@playwright/test";
import { elements } from "../lib/elements";
import {
  elementSlug,
  expeditions,
  findElementBySlug,
  getScience,
  sandboxRecipes,
  scienceMetadata,
  scienceRecords,
} from "../lib/science";
import snapshot from "../lib/science-data.json";
import { validateScienceSnapshot } from "../lib/science-validation.mjs";

test("all 118 neutral ground-state records conserve electrons and respect shell capacity", () => {
  expect(validateScienceSnapshot(snapshot)).toBe(true);
  expect(scienceRecords).toHaveLength(118);
  for (const element of elements) {
    const science = getScience(element.z);
    expect(science.atomicNumber).toBe(element.z);
    expect(science.shells.reduce((sum, electrons) => sum + electrons, 0)).toBe(element.z);
    for (const [shell, electrons] of science.shells.entries()) {
      expect(Number.isInteger(electrons)).toBe(true);
      expect(electrons).toBeGreaterThanOrEqual(0);
      expect(electrons).toBeLessThanOrEqual(2 * (shell + 1) ** 2);
    }
  }
});

test("published exceptions differ from a naive orbital filling model", () => {
  const exceptions: Record<number, number[]> = {
    24: [2, 8, 13, 1],
    29: [2, 8, 18, 1],
    41: [2, 8, 18, 12, 1],
    42: [2, 8, 18, 13, 1],
    46: [2, 8, 18, 18],
    78: [2, 8, 18, 32, 17, 1],
    79: [2, 8, 18, 32, 18, 1],
    103: [2, 8, 18, 32, 32, 8, 3],
  };
  for (const [atomicNumber, shells] of Object.entries(exceptions)) {
    expect(getScience(Number(atomicNumber)).shells).toEqual(shells);
  }
  expect(getScience(103).configuration).toContain("7p1");
  expect(getScience(103).configuration).not.toContain("6d1");
  expect(getScience(103).configurationNote).toMatch(/RSC.*overridden/);
});

test("theoretical assignments, unavailable measurements and model limits are explicit", () => {
  for (let z = 104; z <= 118; z++) {
    expect(getScience(z).configurationNote).toMatch(/theoretical.*uncertain/);
  }
  expect(getScience(109).configuration).toContain("calculated");
  for (let z = 110; z <= 118; z++) {
    expect(getScience(z).configuration).toContain("predicted");
  }
  const missing = scienceRecords.flatMap((science) =>
    science.properties.filter((property) => property.value === "Not reported"),
  );
  expect(missing.length).toBeGreaterThan(0);
  for (const property of missing) {
    expect(property.unit).toBeUndefined();
    expect(property.note).toBeTruthy();
  }
  for (const science of scienceRecords) {
    for (const property of science.properties) {
      expect(property.value).not.toBe("");
      expect(property.note).toBeTruthy();
      if (property.value !== "Not reported" && property.label !== "Standard state") {
        expect(property.unit).toBeTruthy();
        expect(property.note).toMatch(/uncertainty/i);
        expect(Number.isFinite(Number(property.value))).toBe(true);
      }
    }
  }
  expect(scienceMetadata.modelNote).toMatch(/quantum states.*not a probability-density simulation/);
});

test("radioactive mass values retain source precision and their isotope caveat", () => {
  for (const [z, value] of [
    [43, "96.90636"],
    [118, "295.216"],
  ] as const) {
    const science = getScience(z);
    const mass = science.properties.find((property) => property.label === "Atomic mass")!;
    expect(mass.value).toBe(value);
    expect(mass.unit).toBe("u");
    expect(mass.note).toContain("not a standard atomic weight");
    expect(science.sources.some((source) => source.label.includes("PubChem"))).toBe(true);
  }
});

test("each editorial record has non-self connections and authoritative citations", () => {
  for (const science of scienceRecords) {
    for (const text of [
      science.story,
      science.everyday,
      science.fact,
      science.connection.explanation,
    ]) {
      expect(text.trim().length).toBeGreaterThan(20);
    }
    expect(science.connection.atomicNumber).not.toBe(science.atomicNumber);
    expect(() => getScience(science.connection.atomicNumber)).not.toThrow();
    expect(science.sources).toHaveLength(2);
    const rsc = science.sources.find((source) => new URL(source.url).hostname === "www.rsc.org");
    const pubchem = science.sources.find(
      (source) => new URL(source.url).hostname === "pubchem.ncbi.nlm.nih.gov",
    );
    expect(rsc?.url).toContain(`/element/${science.atomicNumber}/`);
    expect(pubchem?.url).toBe("https://pubchem.ncbi.nlm.nih.gov/periodic-table/");
    for (const source of science.sources) {
      expect(new URL(source.url).protocol).toBe("https:");
      expect(source.label).toBeTruthy();
    }
  }
  expect(scienceMetadata.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(scienceMetadata.source).toBe(
    "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON",
  );
});

test("element URLs round-trip, canonical spelling aliases resolve and invalid input fails", () => {
  const slugs = elements.map(elementSlug);
  expect(new Set(slugs).size).toBe(118);
  for (const element of elements) {
    expect(findElementBySlug(elementSlug(element))).toEqual(element);
    expect(findElementBySlug(elementSlug(element).toUpperCase())).toEqual(element);
  }
  for (const [alias, z, canonical] of [
    ["aluminum", 13, "aluminium"],
    ["cesium", 55, "caesium"],
    ["sulphur", 16, "sulfur"],
  ] as const) {
    const element = findElementBySlug(alias);
    expect(element?.z).toBe(z);
    expect(elementSlug(element!)).toBe(canonical);
  }
  expect(findElementBySlug("unknown-element")).toBeUndefined();
  expect(findElementBySlug("<script>")).toBeUndefined();
  for (const invalid of [0, 119, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => getScience(invalid)).toThrow(RangeError);
  }
});

test("expeditions and sandbox examples refer to real elements and distinguish material types", () => {
  expect(new Set(expeditions.map((expedition) => expedition.id)).size).toBe(expeditions.length);
  expect(new Set(sandboxRecipes.map((recipe) => recipe.id)).size).toBe(sandboxRecipes.length);
  for (const item of [...expeditions, ...sandboxRecipes]) {
    expect(item.atomicNumbers.length).toBeGreaterThan(1);
    expect(new Set(item.atomicNumbers).size).toBe(item.atomicNumbers.length);
    for (const z of item.atomicNumbers) expect(() => getScience(z)).not.toThrow();
  }
  expect(sandboxRecipes.find((recipe) => recipe.id === "salt")?.explanation).toMatch(
    /crystal lattice/,
  );
  expect(sandboxRecipes.find((recipe) => recipe.id === "silica")?.explanation).toMatch(
    /extended network/,
  );
  expect(sandboxRecipes.find((recipe) => recipe.id === "bronze")?.explanation).toMatch(
    /no single.*molecular formula/,
  );
  expect(sandboxRecipes.find((recipe) => recipe.id === "neodymium-magnet")?.explanation).toMatch(
    /crystal phase/,
  );
});

test("snapshot validation rejects corrupted science instead of silently displaying it", () => {
  const cases = [
    (broken: typeof snapshot) => {
      broken.records.pop();
    },
    (broken: typeof snapshot) => {
      broken.records[0].shells = [2];
    },
    (broken: typeof snapshot) => {
      broken.records[0].configuration = "2s1";
    },
    (broken: typeof snapshot) => {
      broken.records[0].connection.atomicNumber = 1;
    },
    (broken: typeof snapshot) => {
      broken.records[0].fact = "";
    },
    (broken: typeof snapshot) => {
      broken.records[0].sources[0].url = "http://example.com/";
    },
  ];
  for (const corrupt of cases) {
    const broken = structuredClone(snapshot);
    corrupt(broken);
    expect(() => validateScienceSnapshot(broken)).toThrow();
  }
});
