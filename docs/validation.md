# Validation record

## Current expanded app

The expanded app changes layout, learning, the Three.js scene, data, accessibility, and offline behavior. The historical prototype comparisons below establish the earlier migration baseline; they do not establish visual equivalence for the current redesign.

The current verification suite covers:

- Pure learning-state migration, XP deduplication, daily rewards, spaced review, forgiving streaks, import validation and storage failures.
- All 118 scientific records, orbital capacities and electron totals, exceptional configurations, source hosts, editorial completeness and route slugs.
- Production browser interactions on mobile and desktop: exploration, rotate/pinch/hold gestures, camera controls, scientific inspection, search, focus traps, keyboard navigation, reduced motion and narrow/enlarged-text layouts.
- Journal, rewards, favorites, progress backup, comparison, sandbox, SVG postcards and persisted settings without audio autoplay.
- Server-rendered element pages without JavaScript, canonical/structured metadata, source links, sitemap, manifest, public data, installation affordances and actual offline navigation.

Run `pnpm check`, `pnpm test:unit`, `pnpm science:check`, `pnpm build`, then `pnpm test:e2e` against the current production build. Confirm the final GitHub Actions result for the published commit. A passing earlier commit does not validate later changes. Platform-specific installation, haptics, GPU performance and native sharing still need checks on the target devices.

### Expanded app verification on October 6, 2026

- Frozen pnpm 12.9.1 installation, oxlint, oxfmt, TypeScript and the production build passed.
- All 21 learning-rule unit tests passed; scientific validation checked all 118 records, citations, connections, capacities and neutral electron totals.
- All 68 mobile/desktop browser and data cases were verified locally against production output; the responsive typography test was rechecked after waiting for hydrated layout before measuring. These include real offline reloads and a deliberate differing HTTP cache variant, focus traps, touch cancellation, original quiz-flip interpolation, rewards/backups, comparison, sandbox, postcards, audio preferences and responsive long-name layouts.
- Axe audits cover the explorer themes/search, learning, comparison, playground, postcards, table, quiz, element details and readable references. Automated accessibility checks complement manual and target-device review.
- Visual review found and fixed cramped long names and overlapping hint/mass text. The lower controls now flow together; camera controls remain usable with scientific inspection open.
- Offline fixes clone navigation responses before asynchronous cache I/O and match already restricted public content independently of Next.js transport Vary headers. RSC, API, external and non-GET requests remain excluded.

### Complete elements and animated details on October 6, 2026

- All 118 table symbols are visible; opening the table does not grant discovery XP. Every record includes a required plain-language definition and everyday context, including honest research-only uses.
- Orb taps open the element popup with focus restoration. SVG shell populations retain all electrons, support pause/resume without restarting, stop when hidden, and respond to live reduced-motion changes.
- Root/background coverage, viewport-fit metadata, safe-area spacing, installed-iOS translucent status-bar metadata and browser theme-color synchronization are checked where browser automation supports them. Final system-bar appearance requires target-device review.
- Numeric facts and comparison values use tabular monospace; prose, family names and state labels retain the body font. Source predictions replace generic unknown-state labels where available.
- An initial full production run passed 75 of 76 cases and exposed a slow-frame hold-to-swipe bug. Movement now cancels a started hold. After the fix, all 50 affected mobile/desktop interaction, layout and science cases passed against a rebuilt production bundle, including an explicit long-hold-then-drag regression. All 21 learning tests, science validation, lint, formatting, types and build passed.
- The complete suite now contains 76 browser/data cases. Use the published commit's GitHub Actions run to verify the complete final suite; earlier runs do not validate a later commit.

## Historical shadcn/pnpm migration

- pnpm 12.9.1 installed the committed lockfile with its release-age policy enabled.
- oxlint, oxfmt, TypeScript and the Next.js production build passed.
- Mobile (390×844) and desktop (1440×900) baseline comparisons covered Auto/Day/Midnight/Dusk themes, the theme menu, search input, element details, periodic table and quiz: 18 states in total.
- For each state, native tags, classes, geometry, computed styles (including animation/transition timing, touch behavior and transforms), and settled screenshots matched exactly. The animated WebGL canvas was hidden for these UI screenshots; its source and the prototype stylesheet remained byte-for-byte unchanged.
- Playwright regression tests cover live WebGL, horizontal swiping, hold/release peeking, keyboard navigation, search, details, theme persistence, electron spreading, all 118 table cells, discovery XP, correct/incorrect quiz answers and closing pending quiz timers.
- GitHub Actions configuration was checked with actionlint and parsed as YAML. Vercel credentials are intentionally absent from source; live deployment requires account setup described in deployment.md.

## Hugeicons and Motion update

- Hugeicons React 1.1.10, the MIT-licensed free icon pack 4.3.5 and Motion 14.0.0 are pinned in the pnpm lockfile. A frozen install passed the release-age policy.
- All interface icons use the shared Hugeicons component with the original 20px box and 2.2px stroke. The electron-shell diagram remains custom SVG. A shadcn accordion dry run confirmed that the configured radix-nova registry substitutes Hugeicons imports and components.
- The quiz flip uses Motion's native React animation hook. Browser comparisons at 0, 90, 180, 270, 420 and 600ms matched the original transform matrix and opacity exactly. Duration and easing match the original 600ms cubic-bezier(0.34, 1.5, 0.5, 1). Native interpolation avoids changing the original perspective when transitioning to `none`.
- All 18 mobile/desktop states retained native tags, classes, geometry and settled computed styles, excluding SVG glyph contents and the quiz card's animation-engine metadata. With glyphs and the animated canvas masked, 14 screenshots matched pixel-for-pixel; details/quiz screenshots had small edge-rasterization differences (maximum 13/255 per channel). The Three.js scene and pointer gesture handlers are unchanged.
- Lint, formatting, TypeScript, the production build and eight browser tests passed. The added mobile/desktop tests compare the flip against the original browser-native animation and verify that reduced-motion users can see, answer and close the quiz without entry animation.
- The initial publication to thembaxx/hydromental passed GitHub Actions checks, production build, browser regression tests and CodeQL. Vercel deployment was skipped because deployment credentials were absent. Repository administration endpoints for branch protection/default token permissions remain unavailable to the connected integration; setup recommendations are documented in deployment.md.
