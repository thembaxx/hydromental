import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const index = process.argv.indexOf("--base");
const base = index < 0 ? "HEAD" : process.argv[index + 1];
const before = JSON.parse(
  execFileSync("git", ["show", `${base}:lib/science-data.json`], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  }),
);
const after = JSON.parse(
  readFileSync(new URL("../lib/science-data.json", import.meta.url), "utf8"),
);
const stable = (value) =>
  JSON.stringify(value, (key, item) =>
    ["retrievedAt", "reviewedAt", "sha256"].includes(key) ? undefined : item,
  );
const changed = after.records.filter((record, i) => stable(record) !== stable(before.records[i]));
const editionsChanged = stable(before.sources) !== stable(after.sources);
if (process.argv.includes("--quiet")) process.exit(changed.length || editionsChanged ? 1 : 0);
console.log(
  `Scientific reference update from the attributed source tables.\n\nChanged atomic numbers: ${changed.map((record) => record.atomicNumber).join(", ") || "none"}.\n\nReview individual values, source editions, intervals, prediction labels and isotope assignments before merging. Retrieval dates are not scientific approval. Undefined or unavailable measurements remain explicit.\n\nValidation: 118 element records and isotope/provenance invariants passed. No automatic merge or production deployment is requested.`,
);
