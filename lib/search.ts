import { categories, elements, type Category, type Element } from "@/lib/elements";

const aliases: Record<number, string[]> = {
  13: ["aluminum"],
  16: ["sulphur"],
  55: ["cesium"],
};

const normalize = (text: string) => text.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");

/** Damerau-Levenshtein distance also tolerates adjacent transposed letters. */
function distance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, i) =>
    Array.from({ length: right.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[left.length][right.length];
}

/** Rank exact identities first, then prefixes, substrings and conservative typo matches. */
export function searchElements(query: string, category: Category | "all" = "all"): Element[] {
  const needle = normalize(query);
  const available = elements.filter((element) => category === "all" || element.c === category);
  if (!needle) return available;
  if (/^\d+$/.test(needle)) return available.filter((element) => element.z === Number(needle));
  if (needle.length > 40) return [];
  const ranked = available.map((element) => {
    const names = [element.n, ...(aliases[element.z] ?? [])].map(normalize);
    const symbol = normalize(element.s);
    let score = Number.POSITIVE_INFINITY;
    if (symbol === needle || names.includes(needle)) score = 0;
    else if (symbol.startsWith(needle) || names.some((name) => name.startsWith(needle))) score = 10;
    else if (names.some((name) => name.includes(needle))) score = 20;
    else if (normalize(categories[element.c][0]).includes(needle)) score = 25;
    else if (needle.length >= 3) {
      const typoDistance = Math.min(...names.map((name) => distance(needle, name)));
      const allowed = needle.length >= 7 ? 2 : 1;
      if (typoDistance <= allowed) score = 30 + typoDistance;
    }
    return { element, score };
  });
  return ranked
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score || a.element.z - b.element.z)
    .map(({ element }) => element);
}
