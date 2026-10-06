/** Shared, network-free validation for attributed element data. */
const datasetUrl = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";
const orbitalCapacity = { s: 2, p: 6, d: 10, f: 14 };
const nobleNumbers = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
const orbitalMinimumShell = { s: 1, p: 2, d: 3, f: 4 };

function shellTotals(configuration, configurations, visited = new Set()) {
  const shells = [];
  const core = configuration.match(/\[([A-Za-z]+)\]/)?.[1];
  if (core) {
    if (visited.has(core) || !nobleNumbers[core]) throw new Error("Invalid noble-gas core");
    shells.push(
      ...shellTotals(
        configurations[nobleNumbers[core]],
        configurations,
        new Set([...visited, core]),
      ),
    );
  }
  for (const [, shell, orbital, count] of configuration.matchAll(/(\d)([spdf])(\d+)/g)) {
    const n = Number(shell);
    const electrons = Number(count);
    if (n < orbitalMinimumShell[orbital] || electrons > orbitalCapacity[orbital] || electrons < 1)
      throw new Error("Invalid orbital occupancy");
    shells[n - 1] = (shells[n - 1] ?? 0) + electrons;
  }
  return Array.from({ length: shells.length }, (_, index) => shells[index] ?? 0);
}

function property(label, value, unit, note) {
  return { label, value: value || "Not reported", ...(value && unit ? { unit } : {}), note };
}

export function buildScienceSnapshot(table, previous, retrievedAt) {
  const columns = table.Columns.Column;
  const rows = table.Row.map(({ Cell }) =>
    Object.fromEntries(columns.map((column, index) => [column, Cell[index]])),
  );
  if (rows.length !== 118 || rows.some((row, index) => Number(row.AtomicNumber) !== index + 1)) {
    throw new Error("Expected all 118 PubChem elements in atomic-number order");
  }
  const configurations = Object.fromEntries(
    rows.map((row) => [Number(row.AtomicNumber), row.ElectronConfiguration]),
  );
  // Current RSC ground-state assignment supersedes PubChem's older 6d1 entry.
  configurations[103] = "[Rn]5f14 7s2 7p1";
  const records = rows.map((row, index) => {
    const atomicNumber = index + 1;
    const editorial = previous.records[index];
    if (!editorial || editorial.atomicNumber !== atomicNumber)
      throw new Error("Missing original editorial record");
    const configuration = configurations[atomicNumber]
      .replace(/\](?=\S)/g, "] ")
      .replace(/\s+/g, " ")
      .trim();
    const shells = shellTotals(configuration, configurations);
    if (shells.reduce((total, count) => total + count, 0) !== atomicNumber)
      throw new Error(`Electron total mismatch for ${atomicNumber}`);
    const radioactiveOnly = atomicNumber === 43 || atomicNumber === 61 || atomicNumber >= 84;
    return {
      ...editorial,
      configuration,
      configurationNote:
        atomicNumber === 103
          ? "Current RSC ground-state assignment; PubChem's older 6d1 assignment is overridden."
          : atomicNumber >= 104
            ? "Published theoretical assignment for a superheavy neutral atom; bulk properties and some orbital assignments remain uncertain."
            : "Published neutral-atom ground-state configuration; excited atoms and ions can differ.",
      shells,
      properties: [
        property(
          "Atomic mass",
          row.AtomicMass,
          "u",
          radioactiveOnly
            ? "PubChem value for an element without stable isotopes. This is not a standard atomic weight and may be rounded to an isotope mass number; uncertainty is not supplied."
            : "PubChem rounded atomic-mass value; natural isotope composition can vary. Uncertainty is not supplied in this dataset.",
        ),
        property(
          "Standard state",
          row.StandardState,
          undefined,
          "PubChem classification, including explicit predictions where stated. Reference temperature and pressure are not supplied in the table.",
        ),
        property(
          "First ionisation energy",
          row.IonizationEnergy,
          "eV",
          "Energy to remove the first electron from an isolated neutral gas-phase atom. Uncertainty is not supplied.",
        ),
        property(
          "Electronegativity",
          row.Electronegativity,
          "Pauling scale",
          "A dimensionless relative measure; values depend on the chosen scale. Uncertainty is not supplied.",
        ),
        property(
          "Melting point",
          row.MeltingPoint,
          "K",
          "PubChem reported value. Pressure, allotrope and measurement uncertainty are not specified in the table; consult the cited source.",
        ),
        property(
          "Boiling point",
          row.BoilingPoint,
          "K",
          "PubChem reported value. Pressure and measurement uncertainty are not specified in the table; consult the cited source.",
        ),
        property(
          "Density",
          row.Density,
          "g/cm³",
          "PubChem reported value. Temperature, pressure, allotrope and measurement uncertainty are not specified in the table; gas densities are especially condition-dependent.",
        ),
      ],
    };
  });
  return { ...previous, retrievedAt, source: datasetUrl, records };
}

export function validateScienceSnapshot(snapshot) {
  if (snapshot.records.length !== 118) throw new Error("Science snapshot must contain 118 records");
  const configurations = Object.fromEntries(
    snapshot.records.map((record) => [record.atomicNumber, record.configuration]),
  );
  for (const [index, record] of snapshot.records.entries()) {
    if (
      record.atomicNumber !== index + 1 ||
      record.shells.reduce((sum, count) => sum + count, 0) !== index + 1
    ) {
      throw new Error(`Invalid atomic number or shell total at ${index + 1}`);
    }
    const derivedShells = shellTotals(record.configuration, configurations);
    if (
      JSON.stringify(derivedShells) !== JSON.stringify(record.shells) ||
      record.shells.some(
        (count, shell) => !Number.isInteger(count) || count < 0 || count > 2 * (shell + 1) ** 2,
      )
    ) {
      throw new Error(`Configuration and shell populations disagree at ${index + 1}`);
    }
    for (const key of ["configuration", "configurationNote", "story", "everyday", "fact"]) {
      if (typeof record[key] !== "string" || !record[key].trim())
        throw new Error(`Missing ${key} at ${index + 1}`);
    }
    if (
      !Number.isInteger(record.connection.atomicNumber) ||
      record.connection.atomicNumber < 1 ||
      record.connection.atomicNumber > 118 ||
      record.connection.atomicNumber === record.atomicNumber
    ) {
      throw new Error(`Invalid connection at ${index + 1}`);
    }
    if (
      !record.connection.explanation ||
      record.properties.length !== 7 ||
      record.sources.length < 2
    )
      throw new Error(`Incomplete record ${index + 1}`);
    for (const source of record.sources) {
      const url = new URL(source.url);
      if (
        url.protocol !== "https:" ||
        !["www.rsc.org", "pubchem.ncbi.nlm.nih.gov"].includes(url.hostname)
      )
        throw new Error("Unexpected scientific source");
    }
    for (const entry of record.properties) {
      if (!entry.label || !entry.value || !entry.note)
        throw new Error(`Incomplete property at ${index + 1}`);
    }
  }
  return true;
}
