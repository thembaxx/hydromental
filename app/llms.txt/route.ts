import { elements } from "@/lib/elements";
import { elementSlug } from "@/lib/science";
import { siteOrigin } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const origin = siteOrigin();
  const text = [
    "# Elementals",
    "",
    "> A playful science playground for exploring all 118 chemical elements.",
    "",
    "The animated atoms are illustrative shell models, not literal representations of quantum orbitals. Read the server-rendered element pages for scientific context, electron configurations, everyday uses, and original source links. This index supplements those pages; it does not replace their sources.",
    "",
    "## Core pages",
    `- [Element library](${origin}/elements): All 118 elements grouped by chemical family.`,
    `- [Atom explorer](${origin}/): Interactive atom exploration and learning journal.`,
    `- [Science game playground](${origin}/playground): Eight chemistry games with 3D molecules, isotope and ion controls, equation balancing, periodic puzzles, everyday materials, mystery elements, crystal cutaways and sourced property ordering. Models are illustrative. Keyboard controls, optional timers, local progress and SVG creations are available.`,
    `- [Public element data](${origin}/element-data.json): Element records and source-linked scientific context.`,
    "",
    "## Elements",
    ...elements.map(
      (element) =>
        `- [${element.n} (${element.s}), atomic number ${element.z}](${origin}/elements/${elementSlug(element)})`,
    ),
    "",
  ].join("\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
