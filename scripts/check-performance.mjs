import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const html = readFileSync(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
const paths = [
  ...new Set(
    [...html.matchAll(/<script[^>]+src="(\/_next\/static\/[^"?]+)/g)].map((match) => match[1]),
  ),
];
if (!paths.length) throw new Error("Cannot inspect the production entry scripts");
const bytes = paths.reduce(
  (sum, path) =>
    sum +
    gzipSync(readFileSync(new URL(`../.next/${path.slice("/_next/".length)}`, import.meta.url)))
      .length,
  0,
);
const budget = 450 * 1024;
console.log(
  `Initial explorer JavaScript: ${(bytes / 1024).toFixed(1)} KiB gzip; budget ${budget / 1024} KiB. Heavy 3D scenes and optional measurement load separately.`,
);
if (bytes > budget) throw new Error("Initial JavaScript exceeds the reviewed mobile budget");
