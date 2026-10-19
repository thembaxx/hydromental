# Validation record

## Current expanded app

The expanded app changes layout, learning, the Three.js scene, data, accessibility, and offline behavior. The historical prototype comparisons below establish the earlier migration baseline; they do not establish visual equivalence for the current redesign.

The current verification suite covers:

- Pure learning-state migration, XP deduplication, daily rewards, spaced review, forgiving streaks, import validation and storage failures.
- All 118 scientific records, orbital capacities and electron totals, exceptional configurations, source hosts, editorial completeness and route slugs.
- Production browser interactions on mobile and desktop: exploration, rotate/pinch/hold gestures, camera controls, scientific inspection, search, focus traps, keyboard navigation, reduced motion and narrow/enlarged-text layouts.
- Journal, rewards, favorites, progress backup, comparison, sandbox, SVG postcards and persisted settings without audio autoplay.
- Server-rendered element pages without JavaScript, canonical/structured metadata, source links, sitemap, manifest, public data, installation affordances and actual offline navigation.

### Interactive 3D and curriculum physics on October 19, 2026

- Studio-lit atom studies support drag/pinch, manual keyboard rotation, shell spread, excitation, opt-in audio and a viewport-filling dialog. The live molecule preview, experiment filters, responsive game workspaces and named periodic-table cells are reviewed in [Interactive lab](immersive-lab.md).
- The [CAPS/NSC physics lab](physics-lab.md) adds React Three Fiber projectile and free-body scenes, analytical SI-unit calculations, signed results, worked equations, pause/scrub/step controls, offline access and WebGL fallback. Vertical throws and drops are core examples; the angled trajectory is explicitly an extension.
- Formatting, lint, TypeScript, all 67 unit tests, all 118 science records, asset checks and the production build pass. Initial explorer JavaScript is 424.6 KiB gzip against a 450 KiB budget; physics and atom-study renderers load separately. No dependency or lockfile changes were needed.
- The existing 210-case mobile/desktop regression run passed. After physics integration, all 32 affected browser cases passed; all 10 physics cases passed again after the final mobile layout adjustment. These runs include WCAG scans, real rendered changes, keyboard controls, offline navigation, audio opt-in/mute, scientific results and forced context-loss recovery.
- All 12 Android Chromium and iOS WebKit profile checks pass, covering the fullscreen orientation change, narrow chemistry lab, reference/consent workflows and physics controls. Orientation assertions wait for the browser's resized layout. The final published commit's CI runs the complete expanded 220-case browser suite and 12-case device suite; confirm that commit's result before treating it as deployed.
- Screenshots establish appearance at their captured viewports. Emulated browsers do not establish physical-device GPU performance, haptics, installation or sharing behavior.

Run `pnpm check`, `pnpm test:unit`, `pnpm science:check`, `pnpm build`, then `pnpm test:e2e` against the current production build. Confirm the final GitHub Actions result for the published commit. A passing earlier commit does not validate later changes. Platform-specific installation, haptics, GPU performance and native sharing still need checks on the target devices.

### Connected workspaces on October 13, 2026

- Eleven explorer dialogs and the theme menu now share five workspaces. Related tools retain their view state, Library views share filters, and panel/game navigation integrates with browser history.
- Code checks, all 26 learning unit tests, validation of all 118 science records, and the production build pass. The dependency audit reports no known vulnerabilities.
- The 154-case mobile/desktop suite covers the updated entry points, including all eight games, offline access, progress transfers, accessible keyboard/focus behavior, and live reduced motion. All 77 mobile cases passed in the complete parallel run.
- The two-worker software-rendering run hit six desktop timing limits, including a timeout before browser context creation, and a workspace reconnect interrupted its final cases. All six affected cases and all seven final workspace cases passed in a fresh full Chromium session with one worker (13/13). The remaining desktop checks passed in the parallel run. Local browser verification used a 60-second test allowance; existing longer per-test allowances still apply.
- New workflows verify shared filters across Library views and story navigation, retained Lab state, Journal/practice transitions and answer locks, panel deep links, Back/Forward, 320px WCAG scans, sheet gestures, and suspension/resumption of background WebGL draws.
- Updated mobile and desktop screenshots are visually reviewed in [UI workspaces](ui-workspaces.md); onboarding previews match the revised interface. Physical-device haptics, installation and GPU performance remain platform checks as described above.

### Eight-game playground on October 7, 2026

- Eight games cover 38 authored rounds. Engine regressions validate every solution, atom conservation, smallest coefficient ratios, molecule angles, crystal-site uniqueness/coordination, finite property values and escaped SVG exports.
- All 26 learning-rule unit tests and validation of all 118 element records pass. Backups preserve and sanitize game checkpoints, completion keys, daily claims, personal bests and a capped collection of creations.
- Mobile/desktop workflows cover all eight games, undo/redo, refresh/resume, optional timer pause, atom details and shell inspection, saved model reopening, SVG and progress exports, restore, real touch dragging, camera controls, forced GPU-loss fallback and production offline precaching.
- The hub and each game pass WCAG A/AA axe checks in Noir. All eight fit 320px without page overflow; the periodic puzzle scrolls within its own region. Material hotspots are tested for separation at 320px. Mobile and desktop screenshots were visually reviewed.
- The first full local run passed 117 of 118 cases; one existing multi-step desktop tip test exceeded its 30-second allowance on the software-rendering host. Its allowance now matches the 60 seconds used for other multi-step checks. All eight affected mobile/desktop tip, detective, accessibility and new marker-spacing checks passed after the final adjustments.
- The complete committed browser/data suite now contains 120 cases. The final published commit's GitHub Actions run remains the authority for the complete suite and deployment.

### First-visit introduction on October 7, 2026

- Eight mobile/desktop onboarding cases cover fresh visits, unfinished-tour reloads, real swipe/rotation/keyboard controls, nucleus taps, pause, completion, Settings replay, unchanged learning progress and theme, and blocked browser storage.
- Every step passes WCAG A/AA axe checks at 320px width without horizontal overflow. Explicit controls, dialog focus management and reduced-motion preferences remain available.
- Forty-eight affected explorer, appearance, accessibility, scene, element-popup, learning-feature, discovery and offline cases passed locally. All 21 learning-rule unit tests and validation of all 118 science records passed.
- Day, desktop and Noir screenshots were visually reviewed; the tutorial uses real screenshots of the app. The complete CI suite now includes 90 browser/data cases; confirm the published commit's final Actions result.

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

## Phosphor icons

- Interface icons use `@phosphor-icons/react`. Idle actions use the outline (`regular`) weight. The navigation selection, a saved favorite and completed checks use the solid (`fill`) weight. The electron-shell diagram remains custom SVG.
- The quiz flip uses Motion's native React animation hook. Browser comparisons at 0, 90, 180, 270, 420 and 600ms matched the original transform matrix and opacity exactly. Duration and easing match the original 600ms cubic-bezier(0.34, 1.5, 0.5, 1). Native interpolation avoids changing the original perspective when transitioning to `none`.
- All 18 mobile/desktop states retained native tags, classes, geometry and settled computed styles, excluding SVG glyph contents and the quiz card's animation-engine metadata. With glyphs and the animated canvas masked, 14 screenshots matched pixel-for-pixel; details/quiz screenshots had small edge-rasterization differences (maximum 13/255 per channel). The Three.js scene and pointer gesture handlers are unchanged.
- Lint, formatting, TypeScript, the production build and eight browser tests passed. The added mobile/desktop tests compare the flip against the original browser-native animation and verify that reduced-motion users can see, answer and close the quiz without entry animation.
- The initial publication to thembaxx/hydromental passed GitHub Actions checks, production build, browser regression tests and CodeQL. Vercel deployment was skipped because deployment credentials were absent. Repository administration endpoints for branch protection/default token permissions remain unavailable to the connected integration; setup recommendations are documented in deployment.md.
