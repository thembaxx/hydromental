# Scientific content and sources

Elementals uses an attributed, local scientific snapshot so element pages and core exploration work without an external API call. The snapshot contains all 118 elements, retrieved on **6 October 2026**.

## Quantitative data

The primary source is the [NIH PubChem periodic table](https://pubchem.ncbi.nlm.nih.gov/periodic-table/), available through its [periodic-table JSON API](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON). `lib/science-data.json` stores its electron configurations and selected physical properties, together with the retrieval date and source URL. [PubChem's data-use guidance](https://pubchem.ncbi.nlm.nih.gov/docs/data-use-policies) explains the provenance and use of contributed scientific data.

Values retain the precision supplied by PubChem. They are not promoted to more accurate or independently measured values. Missing entries read **Not reported**. Every displayed property includes its unit or scale and a note explaining the limits of the source:

- Atomic mass uses unified atomic mass units (u). Values for elements without stable isotopes may represent an isotope mass or rounded mass number; they are not standard atomic weights. Natural isotope composition can vary.
- First ionisation energy uses electronvolts (eV), for removing the first electron from an isolated neutral gas-phase atom.
- Electronegativity uses the dimensionless Pauling scale.
- Melting and boiling points use kelvin (K). The table does not provide pressure, allotrope or measurement uncertainty for each value.
- Density uses g/cm³. The table does not provide temperature, pressure, allotrope or measurement uncertainty for each value; this matters especially for gas densities.
- Standard-state labels retain the source wording, including expected states. The table does not provide reference conditions for each entry.

These limitations are presented with the data rather than replaced with invented conditions or uncertainty estimates. Predicted or calculated superheavy configurations retain their source labels, and all superheavy configuration notes explicitly identify the theoretical assignment.

## Electron configurations and the model

Shell populations are derived by expanding noble-gas cores and summing the published orbital occupancies by principal quantum number. This includes exceptions such as chromium, copper, niobium, molybdenum, palladium and platinum. All 118 neutral-atom shell totals equal their atomic number.

**Lawrencium is an explicit source correction.** PubChem currently lists the older `[Rn] 7s2 5f14 6d1` assignment. The [Royal Society of Chemistry's current Lawrencium entry](https://www.rsc.org/periodic-table/element/103/lawrencium) instead gives `[Rn] 5f14 7s2 7p1`; Elementals uses that assignment and documents the override in its refresh script and individual record.

Orbiting dots are an illustrative count model. Electrons occupy quantum states, rather than fixed planetary paths. The scientific view is a labelled schematic and does not claim to calculate electron probability densities, isotope abundances or nuclear structure. Excited atoms and ions can have configurations different from the neutral ground-state record.

## Original editorial content

Each element has an original plain-language definition, short story, everyday context, interesting fact and connection to another element. These are concise paraphrases and educational explanations, rather than copied reference prose. Each record links to its individual [Royal Society of Chemistry element entry](https://www.rsc.org/periodic-table/) and to PubChem. Research-only elements are described as such instead of being given invented everyday uses.

Expedition trails are curated examples, not comprehensive material inventories. Phone construction varies between manufacturers. Biological presence does not imply that the pure element is safe or nutritionally interchangeable with its compounds.

Sandbox examples illustrate bonding, crystal networks, alloying, atom conservation and magnetic materials. They provide no preparation instructions, quantities, operating conditions or hands-on reaction procedures. Sodium chloride is identified as an ionic lattice; silica as a network; bronze as an alloy without a fixed molecular formula; and Nd₂Fe₁₄B as a magnetic crystal phase. These distinctions prevent the sandbox from treating every material as a discrete molecule.

## Refresh and validation

Run `node scripts/refresh-science.mjs --check` to validate the committed snapshot without network access. Run `node scripts/refresh-science.mjs` to refresh the PubChem properties and configurations while preserving original editorial content and citations, then run the project formatter and checks. The refresh validates atomic-number ordering, orbital capacities, shell electron totals, every editorial field, non-self element connections, property completeness and HTTPS source hosts before writing. A failed refresh leaves the committed snapshot intact.

## Playground models and games

Six molecule targets use familiar simplified bonding models linked to PubChem: water (bent, about 104.5°), carbon dioxide (linear), ammonia (trigonal pyramidal, about 107°), methane (tetrahedral, about 109.5°), oxygen and nitrogen. Bond lengths and atom radii are illustrative; O₂ is not a molecular-orbital or magnetism simulation.

The Atom Workshop uses six particle-count targets and the [NIST isotopic-composition reference](https://physics.nist.gov/PhysRefData/Compositions/index.html). Proton count identifies the element, proton plus neutron count gives mass number, and proton minus electron count gives charge. Free compositions are not predictions of stability or natural occurrence. Representative dots are capped at 18 per particle type while controls retain exact counts.

Four net equations teach atom conservation and smallest whole-number coefficients. They do not model reaction conditions, energetics or rates; ammonia is explicitly reversible. See [OpenStax equation balancing](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations).

Salt is an alternating ionic lattice with six nearest unlike neighbours for interior ions, without covalent sticks. Diamond uses the FCC-plus-basis carbon lattice and nearest-neighbour tetrahedral bonds. Graphite uses AB-shifted honeycomb sheets and in-plane bonds, with exaggerated interlayer spacing. Cutaways omit boundary neighbours; additions reveal sections, not chemical reaction steps. See [OpenStax crystalline structures](https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids) and the existing carbon reference.

Everyday Detective uses explicitly identified examples: a phone with silicon chips, copper circuitry, lithium-ion battery materials and neodymium-containing speaker magnets; a bicycle with an aluminium alloy frame, steel chain, rubber tyre and brass bell; a white LED with a gallium-nitride blue emitter, aluminium heat sink, copper wiring and yttrium-based phosphor. These are common material examples, not universal product compositions. Elements occur in alloys, polymers and compounds; white-light technologies vary. Each answer links to the app’s original element sources.

Property Challenge uses actual numeric snapshot values for atomic mass (H/C/O/Fe), melting point (Na/Mg/Al/Si), Pauling electronegativity (Na/Si/Cl/F) and density (Al/Fe/Cu/Au). Density, phase, pressure, allotrope and temperature limitations remain explicit; source precision is retained in element references. Periodic Puzzle uses the real group/period coordinates of the first 20 elements and links to IUPAC. Missing puzzle tiles are intentional challenges; the complete reference table still displays every element.
