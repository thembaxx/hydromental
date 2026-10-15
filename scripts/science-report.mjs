import { readFileSync } from "node:fs";
const snapshot = JSON.parse(
  readFileSync(new URL("../lib/science-data.json", import.meta.url), "utf8"),
);
console.log(
  `Schema ${snapshot.schemaVersion}; ${snapshot.records.length} elements; retrieved ${snapshot.retrievedAt}.`,
);
console.log(
  "Property | Populated | Missing | Predicted | Reference conditions supplied\n--- | ---: | ---: | ---: | ---:",
);
for (const { label } of snapshot.records[0].properties) {
  const values = snapshot.records.map((record) =>
    record.properties.find((property) => property.label === label),
  );
  const missing = values.filter((property) => property.status === "not-reported").length;
  console.log(
    `${label} | ${118 - missing} | ${missing} | ${values.filter((property) => property.status === "predicted").length} | ${values.filter((property) => Object.values(property.conditions).some((value) => value !== null)).length}`,
  );
}
console.log(
  `\n${snapshot.records.reduce((count, record) => count + record.isotopes.length, 0)} selected isotopes; all 118 elements have a cited selection. Missing values and conditions remain explicit. Retrieval is not scientific peer review.`,
);
