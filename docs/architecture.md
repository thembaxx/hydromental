# Application architecture

The Next.js App Router serves both the interactive playground and readable reference content. The playground is client-side because gestures, browser-local progress and WebGL require browser APIs. The element library and individual reference pages render on the server, so scientific text, source links and metadata do not depend on JavaScript or a working GPU.

## Exploration and components

`components/elements-explorer.tsx` coordinates selection, browser history, panels, gestures and learning state. The selected element flows into the canvas, facts, quizzes and side panels. Direct playground links select an element through the `element` query parameter; the reference library uses stable name-based routes.

First-time devices see `components/onboarding.tsx` before the playground. A separate `elementals.onboarding.v1` flag distinguishes an unfinished introduction from completion; existing modern or legacy progress bypasses automatic onboarding. The `/welcome` route and Settings link replay the same guide. Its independent atom selection never awards XP or changes discoveries, favorites or history. A session fallback allows continuation when browser storage is blocked. Each step offers real gestures, equivalent buttons, keyboard controls, local screenshots and reduced-motion-aware text entrances.

Owned shadcn components expose an unstyled variant alongside conventional variants. Radix supplies modal focus management, dismissal and accessible title/description behavior. Search maintains a keyboard-selectable results list with typo tolerance and family filtering. The shared icon component maps interface actions to Hugeicons. Custom SVG remains appropriate for diagrams and downloadable artwork.

Explore gestures navigate elements; Rotate gestures change the camera interaction without navigating. Explicit controls provide alternatives for zoom, reset and pause. The Three.js scene receives a mutable controls object and exposes inspection/reset through its canvas API, avoiding React rendering on every animation frame. Scene resources, animation frames, observers and listeners are cleaned up when the canvas is disposed.

Raycasting the central orb opens the element details dialog in either model. Tapping a scientific shell still inspects that shell. Closing the orb-opened dialog restores focus to the Element details button. Every table cell shows its real symbol; visibility does not award discovery XP. The popup's SVG animates only the electron groups using browser-native transforms, pauses on request and when the document is hidden, and reacts immediately to reduced-motion preference changes. Its electron counts come from the same validated scientific snapshot as the reference pages.

The root and body paint the theme background through the full dynamic viewport. Viewport-fit coverage, translucent installed-iOS status bars, safe-area spacing and theme-aware browser-chrome metadata support edge-to-edge presentation. Browser and operating-system policies control the final status/navigation-bar appearance; verify installed iOS and Android behavior on devices. Numeric facts use tabular JetBrains Mono while descriptions, family names and state labels retain Nunito.

The playful scene uses representative orbiting electrons. The scientific mode is a shell-population schematic derived from the sourced neutral configuration; it is not a quantum-mechanical simulation. Rendering quality is configurable, reduced motion is respected, and unavailable WebGL has a visible fallback. Sound and ambient feedback use generated Web Audio after interaction rather than downloading media or starting automatically.

## Learning state

`lib/learning.ts` owns pure state transitions and validation. The versioned `elementals.learning.v2` record contains discoveries, XP, quiz streak, favorites, history, mastery, activity dates, daily missions, achievements, onboarding and settings. Loading migrates original prototype storage and saving retains its compatibility keys.

Actions return new state. Discovery rewards are awarded once, quiz XP is awarded once per element per UTC day, and mission rewards are claimed once. Mastery records drive due-review scheduling. UTC dates define daily boundaries; activity streaks tolerate one missed day. Import validates and sanitizes a portable JSON record before replacement. This design is local and requires no authentication or backend; exported backups provide device-to-device transfer.

## Scientific content

`lib/science-data.json` is the committed local snapshot. `lib/science.ts` combines scientific records with original stories, everyday context, element connections, expeditions and illustrative material recipes. Numeric values and units retain source precision; unreported conditions, theoretical assignments and missing values remain explicit.

`scripts/refresh-science.mjs` retrieves quantitative PubChem records, preserves authored content and applies the documented Lawrencium assignment from the Royal Society of Chemistry. Validation checks all 118 records before the snapshot is written. The runtime needs no external data API to explore. [Sources](sources.md) describe provenance and limitations in detail.

## Offline and discovery

The production-only service worker precaches the playground shell, public element JSON and local assets, and caches visited reference HTML. It skips RSC requests, external URLs, API traffic and unsafe/non-GET requests. Unvisited reference pages receive a readable offline fallback. A versioned cache and explicit update/restart control preserve the current learning session until the user elects to update.

Metadata, canonical URLs, the XML sitemap, robots instructions, JSON-LD, `/element-data.json` and `/llms.txt` expose the same authored content. The public origin comes from deployment configuration, with a localhost fallback for development. These endpoints improve access to content but do not promise search-engine rankings or assistant citations.

## Delivery boundaries

CI verifies the committed dependency lockfile, code, state/data rules, production routes, browser behavior and CodeQL analysis. Deployment runs only for trusted successful main-branch CI whose tested SHA is still current. Vercel credentials and account-level repository policies require external configuration; the source contains no secrets. See [deployment setup](deployment.md) and [validation scope](validation.md).
