# Elementals

> **Portfolio project** · [Live application](https://hydromental.vercel.app) · [GitHub source](https://github.com/thembaxx/hydromental)
>
> Built with a focus on intuitive interfaces, responsive design and practical product engineering. Explore the live experience or review the implementation below.


A playful science playground for all 118 chemical elements, evolved from the supplied Claude prototype. Explore interactive atoms, read sourced stories, build a learning journal, compare properties, and discover everyday connections.

Repository: [thembaxx/hydromental](https://github.com/thembaxx/hydromental).

## What you can do

- First-time visitors get a four-step introduction with an interactive Three.js atom, animated text and real app screenshots. Practice swipe, rotation, zoom and element details, then start exploring. Replay it anytime from Settings or `/welcome`; the tutorial does not award XP or change saved discoveries.
- Explore Bohr orbitals, an illustrative quantum cloud, and matter views at `/` and `/elements`. Drag to spin, tap to excite, and scrub through all 118 elements. Left/right arrows step, 1/2/3 switch models, and M toggles optional procedural sound. See the [interactive stage guide](docs/interactive-stage.md).
- One Element library combines typo-tolerant search, family cards and the periodic table; switching views preserves the query and family filter. Favorite an element or open its story from the same library.
- Pinch to zoom, spread the electrons, and reset the view from Settings. Hold the atom to reveal proton and electron counts. Stories include scientific shell diagrams with pause controls; games include explicit rotation, zoom and inspection controls.
- Explore all 118 visible symbols without discovery placeholders. Select the element name for a plain-language definition, everyday uses, and an animated shell diagram with pause and live reduced-motion support. Header, metadata and controls render before the deferred WebGL scene.
- Read original element stories, connections and source-linked physical properties, then switch to a postcard in the same detail sheet. The Experiment lab combines comparison and bonding in persistent tabs. The Journal keeps progress and practice together, and Settings includes the exploration guide.
- Play eight games at `/playground`: Molecule Builder, Atom Workshop, Balance It, Periodic Puzzle, Everyday Detective, Mystery Element, Crystal Builder and Property Challenge. Solve 38 authored rounds, use hints, undo/reset, try optional timing, and earn first-completion and daily XP. Model games have free play and saved creations with SVG export.
- Save favorites, revisit recent discoveries, follow collections and expeditions, and earn daily mission rewards. Standard, review, mystery and everyday-context quizzes build a spaced-review queue.
- Choose device-following, Day, Midnight, Dusk or Noir appearance. Noir uses grey backgrounds and text while family colors, state cues and highlights stay in color. Adaptive rendering quality, optional sounds and ambient audio, and supported haptics remain available.
- Export and import validated progress backups. Install when supported, explore the cached playground offline, and read previously visited reference pages offline.
- Share directly addressable `/elements/<name>` reference pages. These pages remain readable without JavaScript; the interactive playground requires JavaScript. The 3D scenes use WebGL and offer fully functional game controls when rendering is unavailable.

The atom, cloud, matter and shell schematic views are teaching illustrations. They do not calculate quantum orbitals or element-specific crystal structures. Bohr rings and detail diagrams use sourced neutral-atom shell populations; nuclei use representative isotope counts. The introduction retains its separate practice model. See [scientific sources and limitations](docs/sources.md).

## Stack

- Next.js 16.4.0, React 19.3.0 and TypeScript 7.0.2
- Tailwind CSS 4.3.3, owned shadcn/ui primitives and Radix accessible dialogs
- Phosphor Icons (`@phosphor-icons/react`) with outline (`regular`) and solid (`fill`) weights
- Motion 14.0.0 and Three.js 0.186.1
- pnpm 12.9.1, oxlint 1.87.0 and oxfmt 0.72.0

Versions are pinned in `package.json` and the committed pnpm lockfile. The dependency baseline was checked on October 6, 2026; subsequent reviewed updates are recorded in the lockfile. Font assets are self-hosted; the application does not request Google Fonts.

## Run locally

Use Node.js 24 and the package-manager version declared by the project.

```sh
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Production and verification commands:

```sh
pnpm check          # lint, formatting and TypeScript
pnpm test:unit      # learning, ingestion, privacy, model and release-tool tests
pnpm science:check  # validate the committed scientific snapshot
pnpm security:audit # check runtime and development dependency advisories
pnpm build         # build production routes and assets
pnpm performance:check # production initial JavaScript budget
pnpm assets:check   # embedded mobile GLB budgets
pnpm exec playwright install chromium
pnpm test:e2e       # starts a production server when none is running
pnpm exec playwright install --with-deps webkit
pnpm test:devices   # Android Chromium and iOS WebKit touch profiles
pnpm start         # serve an existing production build
```

Run `pnpm build` before browser tests. If a server is already listening on port 3000, local Playwright reuses it; restart it after rebuilding to test the current code. Service-worker registration is disabled in development, so offline/install behavior must be tested against a production build. `pnpm format` and `pnpm lint:fix` apply tooling fixes.

## Components and motion

Buttons, inputs, badges, cards and dialog behavior use owned shadcn/Radix components where they fit the interaction. Their `unstyled` variants preserve the custom visual system and pointer handlers; standard variants remain available. `components.json` selects the `radix-nova` registry. Add reviewed component source under `components/ui` and preserve the owned variants. The optional shadcn generator and `ui:add` script were removed because its transitive `braces` dependency has an unpatched advisory; the application does not require the generator. Reconsider installing it only after its dependency graph is patched and audited.

The quiz flip uses `motion/react-mini` native animation and `motion/react` reduced-motion detection. It retains the prototype's 600ms perspective flip and easing. Dialog entry motion, responsive layout, focus behavior and the enhanced Three.js scene are implemented separately. Electron-shell diagrams and postcard artwork remain custom SVGs.

The centered Explore, Learn, Lab and Play dock uses icon-only Phosphor marks: outline when idle and solid when that workspace is active. Motion's shared layout follows the selection. The game area shares the same destinations and preference controls. Related panels use accessible keyboard tabs that retain in-progress comparisons and bonding models. Browser Back/Forward opens or dismisses panels and games; closing a panel keeps the selected element in the URL. Mobile sheets also support a downward handle gesture. Entry, exit and view motion follow live reduced-motion preferences, with focus restored to the opener. Gesture and model tips show for eight seconds, then fade without shifting the controls; switching modes shows the relevant tip again. Full guidance remains in Help and Settings.

The introduction uses Motion for staggered text entrances and step transitions, with an actual Three.js scene for practice. App screenshots are local assets. Explicit buttons and keyboard navigation complement touch gestures; visitors can pause the atom, skip the guide or replay it without changing their learning record.

## Learning and data

Progress stays in browser local storage. Versioned learning state migrates the original prototype's discovery/XP/streak keys and retains a compatibility mirror. New discoveries award 10 XP. Correct quiz answers award 5 XP once per element per UTC day; repeating an answer can update mastery without repeatedly awarding XP. Daily rewards can be claimed once, review intervals respond to results, and the activity streak allows one missed day.

Playground completions award 20 XP once per authored round. A deterministic UTC daily game awards an additional 10 XP once per day, including when revisiting an already completed round. Optional personal bests require unhinted timed solves. Free play awards no game XP. Each of eight games tracks solved rounds; the lab retains the latest 24 creations and checkpoints the current round. All of this is included in existing progress backups.

Progress export/import transfers learning state and settings between devices. This is a portable backup, not an account or cloud-sync service. Clearing browser storage removes local progress; keep an exported backup if it matters to you. Audio begins only after interaction and is optional.

The committed scientific snapshot contains all 118 elements, original editorial content and source links. Refresh it with `node scripts/refresh-science.mjs`, then format and verify the changes. The refresh preserves authored content and validates the result before writing. [Source documentation](docs/sources.md) explains physical-property conditions, theoretical configurations and the explicit Lawrencium correction.

## Project structure

- `app/`: explorer entry, server-rendered element library/reference pages, metadata, sitemap, robots, manifest, public JSON and service-worker route.
- `components/elements-explorer.tsx`: interaction orchestration, responsive workspace and learning-state integration.
- `components/`: search/dialog, learning, comparison, sandbox, settings, postcards, quiz, atom canvas and PWA controls.
- `components/ui/`: owned shadcn primitives and shared Phosphor icon rendering.
- `lib/learning.ts`: pure progress, migration, mastery, daily missions, achievements and backup rules.
- `lib/science.ts`, `lib/science-data.json`: scientific records, shell populations, stories, expeditions and material examples.
- `lib/playground.ts`, `lib/playground-export.ts`: authored game catalogs, answer rules, molecule/crystal models and safe standalone SVG exports.
- `components/playground-*`: full game hub, game controls and disposable Three.js renderer with keyboard alternatives.
- `lib/atom-scene.ts`: Three.js models, inspection, camera control, rendering lifecycle and cleanup.
- `lib/service-worker-source.ts`: offline caching and update protocol.
- `public/`: local fonts, licenses, brand mark, install icons and share artwork.
- `tests/`: learning unit tests and production browser/data/accessibility regressions.
- `docs/original-prototype.html`: archived source reference, excluded from application routes and tooling.

See [the architecture guide](docs/architecture.md) for state, rendering, data and offline boundaries. [Theming and startup](docs/theming.md) covers seamless viewport backgrounds, browser colors, theme-specific install manifests and platform limits.

## Delivery and discovery

GitHub Actions runs frozen installs, code checks, learning/data validation, production builds, browser regression tests, CodeQL, dependency review and a full dependency advisory audit on every CI run and weekly. Dependabot maintains dependencies and immutable action pins. The production deployment workflow targets Vercel after trusted successful main-branch CI and checks that the tested commit is still current.

Production deployment is configured and live at [hydromental.vercel.app](https://hydromental.vercel.app). Repository protection and account-level Actions policies require administration access and have not been applied by the connected integration. See [deployment setup](docs/deployment.md). This project is not configured as a GitHub Pages static export.

Configure the real public origin before deployment. [Discovery and offline documentation](docs/discovery-and-offline.md) covers canonical URLs, structured data, readable HTML, `/llms.txt`, install behavior and cache limitations. These make content accessible to crawlers and assistants but do not guarantee indexing or citation.

The uploaded notes remain in `PROTOTYPE-NOTES.md`. The original prototype has no assigned license. Dependency and font notices are in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

See the [security audit](docs/security-audit.md) for findings, browser defenses and remaining account-level work.

## Elemental redesign

The immersive mobile-first explorer uses React Three Fiber, Blender-generated GLB models, complete interactive GLSL shaders, GSAP drag/snapping and local procedural audio. It stays in this Next.js/TypeScript/Tailwind application. See [the source manifest, asset workflow and touch verification](docs/elemental-redesign.md), and [CI/release setup](docs/deployment.md).

## Trusted reference data and mobile measurement

Every view derives masses and phases from one scientific snapshot. CIAAW atomic-weight intervals remain dimensionless; NIST/NUBASE data add 324 selected isotopes with natural fractions, half-lives and decay. Eleven property fields include oxidation states, discovery dates, radius and affinity. Sources, editions, uncertainty and missing reference conditions are explicit. See [trusted science](docs/trusted-science.md).

Optional [measurement](docs/measurement.md) is off until visitors opt in, honors privacy signals and excludes personal learning content. The existing hosting plan determines custom-event eligibility. See [mobile readiness](docs/mobile-readiness.md) for renderer/asset budgets, complete Blender scene support, emulated touch tests and the physical-device checks still required.
