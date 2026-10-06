/** Refresh the attributed PubChem numeric snapshot without replacing original editorial content. */
import { readFile, writeFile } from "node:fs/promises";
import * as http from "node:http";
import { buildScienceSnapshot, validateScienceSnapshot } from "../lib/science-validation.mjs";
export { buildScienceSnapshot, validateScienceSnapshot } from "../lib/science-validation.mjs";

// Node 24 supports the same standard proxy variables used by package managers.
http.setGlobalProxyFromEnv?.();

const datasetUrl = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";
const dataPath = new URL("../lib/science-data.json", import.meta.url);

if (process.argv[1] && new URL(process.argv[1], "file:").href === import.meta.url) {
  const previous = JSON.parse(await readFile(dataPath, "utf8"));
  if (process.argv.includes("--check")) {
    validateScienceSnapshot(previous);
    console.log(
      "Validated 118 science records, source links, connections and neutral-atom electron totals.",
    );
  } else {
    const response = await fetch(datasetUrl, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`PubChem request failed (${response.status})`);
    const { Table } = await response.json();
    const snapshot = buildScienceSnapshot(Table, previous, new Date().toISOString().slice(0, 10));
    validateScienceSnapshot(snapshot);
    await writeFile(dataPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log("Refreshed and validated 118 science records. Run pnpm format before committing.");
  }
}
