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
