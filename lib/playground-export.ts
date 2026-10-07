import { elements } from "./elements";
import { normalizeSession, sessionModel } from "./playground";
import type { Creation } from "./learning";
const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
/** Self-contained vector keeps saved models portable without image or font requests. */
export function creationSvg(creation: Creation): string {
  const model = sessionModel(normalizeSession(creation.session));
  const project = (position: number[]) => [
    300 + position[0] * 75 + position[2] * 22,
    260 - position[1] * 75 + position[2] * 15,
  ];
  const bonds = model.bonds
    .map((bond) => {
      const a = project(model.atoms[bond.a].position),
        b = project(model.atoms[bond.b].position);
      return Array.from(
        { length: bond.order ?? 1 },
        (_, i) =>
          `<line x1="${a[0]}" y1="${a[1] + (i - ((bond.order ?? 1) - 1) / 2) * 9}" x2="${b[0]}" y2="${b[1] + (i - ((bond.order ?? 1) - 1) / 2) * 9}" stroke="#7c8799" stroke-width="5"/>`,
      ).join("");
    })
    .join("");
  const atoms = model.atoms
    .map((atom) => {
      if (atom.ghost) return "";
      const [x, y] = project(atom.position);
      const particle = atom.kind;
      const label = particle
        ? particle === "proton"
          ? "+"
          : particle === "neutron"
            ? "n"
            : "−"
        : elements[atom.z - 1].s;
      const r = particle ? 10 : 25;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${particle === "electron" ? "#dbe7fc" : "#e7e9f0"}" stroke="#526079" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="${particle ? 11 : 17}" font-family="monospace" fill="#202b48">${label}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 510" role="img" aria-labelledby="title desc"><title id="title">${xml(creation.title)}</title><desc id="desc">${xml(`${model.title}. ${model.note}. Illustrative model, not to scale.`)}</desc><rect width="600" height="510" rx="32" fill="#f4f6fa"/><text x="30" y="43" font-family="sans-serif" font-size="14" fill="#526079">ELEMENTALS · MY LAB</text><text x="30" y="78" font-family="sans-serif" font-size="22" fill="#202b48">${xml(creation.title)}</text><text x="30" y="107" font-family="monospace" font-size="15" fill="#526079">${xml(model.title)}</text>${bonds}${atoms}<text x="30" y="448" font-family="sans-serif" font-size="12" fill="#526079">Illustrative model · sizes and distances are not to scale.</text><text x="30" y="473" font-family="sans-serif" font-size="12" fill="#526079">hydromental.vercel.app/playground · ${xml(new Date(creation.at).toISOString().slice(0, 10))}</text></svg>`;
}
export function downloadText(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
