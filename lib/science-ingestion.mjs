/** Strict parsers for the cited scientific tables. Never execute upstream HTML. */
import { createHash } from "node:crypto";

export const scienceSources = {
  pubchem: {
    label: "PubChem periodic table",
    url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON",
    edition: "Live periodic table",
  },
  ciaaw: {
    label: "CIAAW standard atomic weights",
    url: "https://ciaaw.org/atomic-weights.htm",
    edition: "2024",
  },
  nist: {
    label: "NIST isotopic compositions",
    url: "https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=&all=all&ascii=ascii2&isotype=all",
    edition: "NIST SRD 144 (2015 evaluation)",
  },
  nubase: {
    label: "NUBASE2020 evaluated nuclear properties",
    url: "https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt",
    edition: "NUBASE2020; Kondev et al., Chinese Physics C 45, 030001 (2021)",
  },
};
export function sourceEvidence(key, raw, retrievedAt) {
  return {
    ...scienceSources[key],
    retrievedAt,
    reviewedAt: null,
    sha256: createHash("sha256").update(raw).digest("hex"),
  };
}
const text = (html) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .trim();
export function parseCiaaw(html) {
  if (!html.includes("Standard Atomic Weights 2024"))
    throw new Error("CIAAW edition changed; review the parser and source edition");
  const table = html.match(/<table id="mytable"[\s\S]*?<\/table>/)?.[0];
  if (!table) throw new Error("CIAAW atomic-weight table is missing");
  const entries = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(([, cell]) => text(cell));
    if (!/^\d+$/.test(cells[0] ?? "")) return [];
    const value = cells[3].replace(/\s/g, "");
    if (!/^(?:—|\[\d+(?:\.\d+)?,\d+(?:\.\d+)?\]|\d+(?:\.\d+)?(?:\(\d+\))?)$/.test(value))
      throw new Error(`Invalid CIAAW value ${value}`);
    const interval = value.startsWith("[") ? value.slice(1, -1).split(",").map(Number) : null;
    return [
      {
        atomicNumber: Number(cells[0]),
        symbol: cells[1],
        value,
        interval,
        numericValue: value === "—" ? null : interval ? null : Number(value.replace(/\(.*\)/, "")),
        uncertainty: value.match(/\(\d+\)/)?.[0] ?? null,
        flags: cells[4],
      },
    ];
  });
  if (entries.length !== 118 || entries.some((entry, index) => entry.atomicNumber !== index + 1))
    throw new Error("Expected 118 ordered CIAAW records");
  return entries;
}
export function parseNist(html) {
  const pre = text(html.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1] ?? "");
  const rows = [
    ...pre.matchAll(
      /Atomic Number = (\d+)\nAtomic Symbol = (\S+)\nMass Number = (\d+)\nRelative Atomic Mass = ([^\n]*)\nIsotopic Composition = ([^\n]*)/g,
    ),
  ].map(([, z, , a, mass, abundance]) => ({
    atomicNumber: Number(z),
    massNumber: Number(a),
    mass: mass.trim(),
    abundance: abundance.trim() || null,
  }));
  if (rows.length < 3000 || !rows.some((row) => row.atomicNumber === 92 && row.massNumber === 238))
    throw new Error("Incomplete NIST isotope table");
  return rows;
}
export function parseNubase(raw) {
  if (!raw.startsWith("# Nubase2020 citation:")) throw new Error("Unexpected NUBASE edition");
  const rows = raw
    .split("\n")
    .filter((line) => /^\d{3} \d{3}0 /.test(line))
    .map((line) => {
      const atomicNumber = Number(line.slice(4, 7));
      const halfLife = line.slice(69, 78).trim();
      const unit = line.slice(78, 80).trim();
      const decay = line.slice(119, 209).trim();
      return {
        atomicNumber,
        massNumber: Number(line.slice(0, 3)),
        halfLife,
        halfLifeUnit: unit || null,
        halfLifeUncertainty: line.slice(81, 88).trim() || null,
        estimated: halfLife.includes("#"),
        decay: decay.replace(/(?:^|;)IS=[^;]*/g, "").trim() || null,
      };
    })
    .filter((row) => row.atomicNumber >= 1 && row.atomicNumber <= 118);
  if (rows.length < 3000 || new Set(rows.map((row) => row.atomicNumber)).size !== 118)
    throw new Error("Incomplete NUBASE ground states");
  return rows;
}
const years = {
  ys: 1e-24,
  zs: 1e-21,
  as: 1e-18,
  fs: 1e-15,
  ps: 1e-12,
  ns: 1e-9,
  us: 1e-6,
  ms: 1e-3,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  y: 31557600,
  ky: 31557600e3,
  My: 31557600e6,
  Gy: 31557600e9,
  Ty: 31557600e12,
  Py: 31557600e15,
  Ey: 31557600e18,
  Zy: 31557600e21,
  Yy: 31557600e24,
};
const lifetime = (row) =>
  row.halfLife === "stbl"
    ? Infinity
    : (Number.parseFloat(row.halfLife.replace(/[<>~#]/g, "")) || 0) *
      (years[row.halfLifeUnit] ?? 0);

export function enrichScienceSnapshot(snapshot, inputs, retrievedAt) {
  const weights = parseCiaaw(inputs.ciaaw);
  const nist = parseNist(inputs.nist);
  const nuclear = parseNubase(inputs.nubase);
  const sources = Object.fromEntries(
    Object.entries(inputs).map(([key, raw]) => [key, sourceEvidence(key, raw, retrievedAt)]),
  );
  const records = snapshot.records.map((record, index) => {
    const weight = weights[index];
    const isotopes = nuclear.filter((row) => row.atomicNumber === record.atomicNumber);
    const longest = [...isotopes].sort((a, b) => lifetime(b) - lifetime(a))[0];
    const selected = isotopes.filter(
      (row) =>
        nist.some(
          (isotope) =>
            isotope.atomicNumber === row.atomicNumber &&
            isotope.massNumber === row.massNumber &&
            isotope.abundance,
        ) ||
        row === longest ||
        (row.atomicNumber === 1 && row.massNumber === 3) ||
        (row.atomicNumber === 6 && row.massNumber === 14),
    );
    const properties = record.properties.map((property) => {
      if (property.label !== "Atomic mass") return property;
      if (weight.value === "—")
        return {
          ...property,
          displayLabel: "Source isotope mass",
          quantity: "isotope-mass",
          note: `${property.note} CIAAW assigns no standard atomic weight to this element. The PubChem isotope is not necessarily the longest-lived isotope.`,
        };
      return {
        label: "Atomic mass",
        displayLabel: "Standard atomic weight",
        quantity: "standard-atomic-weight",
        value: weight.interval ? `[${weight.interval[0]}, ${weight.interval[1]}]` : weight.value,
        numericValue: weight.numericValue,
        interval: weight.interval,
        uncertainty: weight.uncertainty,
        status: "evaluated",
        conditions: { temperatureK: null, pressurePa: null, allotrope: null },
        source: sources.ciaaw,
        note: `CIAAW 2024 standard atomic weight (dimensionless). ${weight.interval ? "The interval reflects variation in normal terrestrial isotope compositions, not measurement uncertainty." : "Parentheses give uncertainty in the last quoted digits."} Source flags: ${weight.flags || "none"}.`,
      };
    });
    return {
      ...record,
      properties,
      isotopes: selected.map((row) => {
        const isotope = nist.find(
          (item) => item.atomicNumber === row.atomicNumber && item.massNumber === row.massNumber,
        );
        return {
          massNumber: row.massNumber,
          relativeAtomicMass: isotope?.mass ?? null,
          abundance: isotope?.abundance ?? null,
          halfLife: row.halfLife,
          halfLifeUnit: row.halfLifeUnit,
          halfLifeUncertainty: row.halfLifeUncertainty,
          estimated: row.estimated,
          decay: row.decay,
          representative: row === longest && !selected.some((item) => item.halfLife === "stbl"),
          sources: { massAndAbundance: isotope ? sources.nist : null, nuclear: sources.nubase },
        };
      }),
      sources: [
        ...record.sources.filter(
          (source) =>
            ![
              scienceSources.ciaaw.url,
              scienceSources.nist.url,
              scienceSources.nubase.url,
            ].includes(source.url),
        ),
        ...[sources.ciaaw, sources.nist, sources.nubase].map(({ label, url }) => ({ label, url })),
      ],
    };
  });
  return {
    ...snapshot,
    schemaVersion: 2,
    sources,
    records: records.map((record) => ({
      ...record,
      properties: record.properties.map(({ source, ...property }) => ({
        ...property,
        sourceId: source.url === scienceSources.ciaaw.url ? "ciaaw" : "pubchem",
      })),
      isotopes: record.isotopes.map(({ sources: isotopeSources, ...isotope }) => ({
        ...isotope,
        sources: {
          massAndAbundance: isotopeSources.massAndAbundance ? "nist" : null,
          nuclear: "nubase",
        },
      })),
    })),
  };
}
