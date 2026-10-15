/** Refresh the attributed PubChem numeric snapshot without replacing original editorial content. */
import { readFile, writeFile } from "node:fs/promises";
import * as http from "node:http";
import { buildScienceSnapshot, validateScienceSnapshot } from "../lib/science-validation.mjs";
import {
  enrichScienceSnapshot,
  scienceSources,
  sourceEvidence,
} from "../lib/science-ingestion.mjs";
export { buildScienceSnapshot, validateScienceSnapshot } from "../lib/science-validation.mjs";

// Node 24 supports the same standard proxy variables used by package managers.
http.setGlobalProxyFromEnv?.();

const dataPath = new URL("../lib/science-data.json", import.meta.url);

if (process.argv[1] && new URL(process.argv[1], "file:").href === import.meta.url) {
  const previous = JSON.parse(await readFile(dataPath, "utf8"));
  if (process.argv.includes("--check")) {
    validateScienceSnapshot(previous);
    console.log(
      "Validated 118 science records, source links, connections and neutral-atom electron totals.",
    );
  } else {
    const inputs = Object.fromEntries(
      await Promise.all(
        Object.entries(scienceSources).map(async ([key, source]) => {
          const response = await fetch(source.url, {
            signal: AbortSignal.timeout(30_000),
            redirect: "error",
          });
          if (!response.ok) throw new Error(`${key} request failed (${response.status})`);
          return [key, await response.text()];
        }),
      ),
    );
    const retrievedAt = new Date().toISOString().slice(0, 10);
    const { Table } = JSON.parse(inputs.pubchem);
    const snapshot = enrichScienceSnapshot(
      buildScienceSnapshot(
        Table,
        previous,
        retrievedAt,
        sourceEvidence("pubchem", inputs.pubchem, retrievedAt),
      ),
      inputs,
      retrievedAt,
    );
    validateScienceSnapshot(snapshot);
    if (process.argv.includes("--report")) {
      const changed = snapshot.records.filter(
        (record, index) =>
          JSON.stringify(record, (key, value) =>
            ["retrievedAt", "reviewedAt", "sha256"].includes(key) ? undefined : value,
          ) !==
          JSON.stringify(previous.records[index], (key, value) =>
            ["retrievedAt", "reviewedAt", "sha256"].includes(key) ? undefined : value,
          ),
      );
      console.log(
        JSON.stringify(
          {
            changedAtomicNumbers: changed.map((record) => record.atomicNumber),
            sources: snapshot.sources,
          },
          null,
          2,
        ),
      );
    } else await writeFile(dataPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log("Refreshed and validated 118 science records. Run pnpm format before committing.");
  }
}
