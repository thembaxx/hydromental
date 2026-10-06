# Elementals

A playful science playground for all 118 chemical elements, evolved from the supplied Claude prototype. Explore interactive atoms, read sourced stories, build a learning journal, compare properties, and discover everyday connections.

Repository: [thembaxx/hydromental](https://github.com/thembaxx/hydromental).

## What you can do

- Explore with swipe, arrow keys, period/group controls, a searchable periodic table, and typo-tolerant search by name, symbol or atomic number. Filter search by element family.
- Switch between Explore and Rotate gestures. Pinch or use explicit zoom controls, reset the camera, pause motion, and inspect the nucleus or scientific shells. Hold the scene to reveal proton and electron counts.
- Explore all 118 visible symbols without discovery placeholders. Tap the central orb for a plain-language definition, everyday uses, and an animated shell diagram with pause and live reduced-motion support.
- Read original element stories, connections and source-linked physical properties. Compare two elements, try the bonding/material sandbox, and export a discovery postcard as SVG.
- Save favorites, revisit recent discoveries, follow collections and expeditions, and earn daily mission rewards. Standard, review, mystery and everyday-context quizzes build a spaced-review queue.
- Choose device-following, Day, Midnight, Dusk or Noir appearance. Noir uses true-black backgrounds, softer text and entirely grayscale visuals for low-light reading. Adaptive rendering quality, optional sounds and ambient audio, and supported haptics remain available.
- Export and import validated progress backups. Install when supported, explore the cached playground offline, and read previously visited reference pages offline.
- Share directly addressable `/elements/<name>` reference pages. These pages remain readable without JavaScript; the interactive playground requires JavaScript and WebGL.

The playful atom and scientific shell schematic are teaching illustrations. They do not simulate quantum orbitals or electron probability densities. The playful view uses representative orbiting dots; the scientific view and detail diagrams use the sourced neutral-atom shell populations. See [scientific sources and limitations](docs/sources.md).

## Stack

- Next.js 16.3.8, React 19.3.0 and TypeScript 7.0.2
- Tailwind CSS 4.3.3, owned shadcn/ui primitives and Radix accessible dialogs
- Hugeicons React 1.1.10 with the free icon pack 4.3.5
- Motion 14.0.0 and Three.js 0.186.1
- pnpm 12.9.1, oxlint 1.87.0 and oxfmt 0.72.0

Versions are pinned in `package.json` and the committed pnpm lockfile. These were the npm `latest` releases checked on October 6, 2026. Font assets are self-hosted; the application does not request Google Fonts.

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
pnpm test:unit      # learning-state unit tests
pnpm science:check  # validate the committed scientific snapshot
pnpm build         # build production routes and assets
pnpm exec playwright install chromium
pnpm test:e2e       # starts a production server when none is running
pnpm start         # serve an existing production build
```

Run `pnpm build` before browser tests. If a server is already listening on port 3000, local Playwright reuses it; restart it after rebuilding to test the current code. Service-worker registration is disabled in development, so offline/install behavior must be tested against a production build. `pnpm format` and `pnpm lint:fix` apply tooling fixes.

## Components and motion

Buttons, inputs, badges, cards and dialog behavior use owned shadcn/Radix components where they fit the interaction. Their `unstyled` variants preserve the custom visual system and pointer handlers; standard variants remain available. `components.json` selects the `radix-nova` registry and Hugeicons. Add components with `pnpm ui:add <component>` and preserve the owned variants instead of replacing the theme with an initializer.

The quiz flip uses `motion/react-mini` native animation and `motion/react` reduced-motion detection. It retains the prototype's 600ms perspective flip and easing. Dialog entry motion, responsive layout, focus behavior and the enhanced Three.js scene are implemented separately. Electron-shell diagrams and postcard artwork remain custom SVGs.

The icon-only dock uses Motion's shared layout and spring transitions for its sliding selection pill and press feedback. It follows live reduced-motion preferences and keeps accessible names and dialog focus restoration. Gesture and model tips show for eight seconds, then fade without shifting the controls; switching modes shows the relevant tip again. Full guidance remains in Help and Settings.

## Learning and data

Progress stays in browser local storage. Versioned learning state migrates the original prototype's discovery/XP/streak keys and retains a compatibility mirror. New discoveries award 10 XP. Correct quiz answers award 5 XP once per element per UTC day; repeating an answer can update mastery without repeatedly awarding XP. Daily rewards can be claimed once, review intervals respond to results, and the activity streak allows one missed day.

Progress export/import transfers learning state and settings between devices. This is a portable backup, not an account or cloud-sync service. Clearing browser storage removes local progress; keep an exported backup if it matters to you. Audio begins only after interaction and is optional.

The committed scientific snapshot contains all 118 elements, original editorial content and source links. Refresh it with `node scripts/refresh-science.mjs`, then format and verify the changes. The refresh preserves authored content and validates the result before writing. [Source documentation](docs/sources.md) explains physical-property conditions, theoretical configurations and the explicit Lawrencium correction.

## Project structure

- `app/`: explorer entry, server-rendered element library/reference pages, metadata, sitemap, robots, manifest, public JSON and service-worker route.
- `components/elements-explorer.tsx`: interaction orchestration, responsive workspace and learning-state integration.
- `components/`: search/dialog, learning, comparison, sandbox, settings, postcards, quiz, atom canvas and PWA controls.
- `components/ui/`: owned shadcn primitives and shared Hugeicons rendering.
- `lib/learning.ts`: pure progress, migration, mastery, daily missions, achievements and backup rules.
- `lib/science.ts`, `lib/science-data.json`: scientific records, shell populations, stories, expeditions and material examples.
- `lib/atom-scene.ts`: Three.js models, inspection, camera control, rendering lifecycle and cleanup.
- `lib/service-worker-source.ts`: offline caching and update protocol.
- `public/`: local fonts, licenses, brand mark, install icons and share artwork.
- `tests/`: learning unit tests and production browser/data/accessibility regressions.
- `docs/original-prototype.html`: archived source reference, excluded from application routes and tooling.

See [the architecture guide](docs/architecture.md) for state, rendering, data and offline boundaries.

## Delivery and discovery

GitHub Actions runs frozen installs, code checks, learning/data validation, production builds, browser regression tests, CodeQL and dependency review. Dependabot maintains dependencies and immutable action pins. The production deployment workflow targets Vercel after trusted successful main-branch CI and checks that the tested commit is still current.

Vercel secrets have not been provisioned; deployment reports a skip until they are configured. Repository protection and account-level Actions policies also require administration access and have not been applied by the connected integration. See [deployment setup](docs/deployment.md). This project is not configured as a GitHub Pages static export.

Configure the real public origin before deployment. [Discovery and offline documentation](docs/discovery-and-offline.md) covers canonical URLs, structured data, readable HTML, `/llms.txt`, install behavior and cache limitations. These make content accessible to crawlers and assistants but do not guarantee indexing or citation.

The uploaded notes remain in `PROTOTYPE-NOTES.md`. The original prototype has no assigned license. Dependency and font notices are in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
