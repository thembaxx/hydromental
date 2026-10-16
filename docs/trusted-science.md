# Scientific reference data

`lib/science-data.json` is the authoritative property snapshot for all 118 elements. `lib/elements.ts` retains identity, classification and table layout only; mass and phase are derived from the snapshot. Scientific period/group are distinct from `gridRow`/`gridColumn`. The same formatter renders property citations in detail sheets and public pages.

The snapshot has eleven properties per element and 324 selected ground-state isotopes. CIAAW's 2024 standard atomic weights supersede rounded PubChem weights where a standard weight exists. Intervals remain intervals, uncertainty notation is preserved, and standard atomic weight is dimensionless. Elements without a standard atomic weight retain PubChem's explicitly identified isotope mass in u; that isotope is not asserted to be the longest lived. Thorium, protactinium and uranium retain their CIAAW standard weights despite lacking stable isotopes.

Each property references an HTTPS source, source edition, retrieval date and SHA-256 digest. `reviewedAt: null` means no independent scientific review is claimed. Evidence statuses distinguish reported, evaluated, predicted and unavailable values. Source temperature, pressure, allotrope and uncertainty are null when the upstream table omits them. A source's classification is not proof of a measured bulk phase for a superheavy element; those phases are explicitly predicted. No missing value is filled from inference.

NIST SRD 144 supplies isotope relative masses and natural fractions with its original uncertainty notation. NUBASE2020 supplies ground-state half-lives, limits, estimates and decay branches. The selection includes natural-composition entries, tritium and carbon-14, and a reference isotope for other elements. It is not an exhaustive nuclide chart or an isomer dataset. “No decay observed” follows that evaluation; natural abundance varies by sample. Published editions and retrieval dates are different concepts.

```sh
pnpm science:check     # Local invariants, no network or freshness assertion
pnpm science:report    # Coverage, missing values, predictions, condition gaps
pnpm science:refresh   # Fetch all four sources; preserve original editorial text
node scripts/refresh-science.mjs --report  # Inspect upstream changes without writing
```

The weekly `science-refresh.yml` proposes substantive changes through a PR, runs CI explicitly, and never merges it automatically. An upstream edition/format change fails closed. Review scientific differences before merging; automated validation catches structural errors but is not peer review. Source links are available in the application and machine-readable `/element-data.json` (schema 2).

Remaining research work is explicit: 101 of the original seven-property cells remain unreported upstream, and reference temperature/pressure/allotrope conditions remain unspecified in the source table. New radius, affinity, oxidation-state and discovery fields have their own source gaps. Prioritize evaluated, field-specific sources and human scientific review over increasing a completeness percentage. Original editorial content and quiz explanations remain subject to expert review.

Quiz feedback now explains the concept behind each answer and waits for the reader to choose Next. It does not disappear on a fixed timer; keyboard focus moves to the first option of the next question.
