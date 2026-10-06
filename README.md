# Elementals

A Next.js App Router conversion of the supplied Claude prototype. It preserves the mobile-first layout, interactive 3D atoms, all 118 elements, periodic table, search, quiz, gestures, themes, and browser-local progress.

## Stack

- Next.js 16.3.8 and React 19.3.0
- Tailwind CSS 4.3.3, with the original visual tokens and custom animation styles
- shadcn/ui Button, Input, Badge and Card primitives, adapted to preserve the prototype
- pnpm 12.9.1 as the default package manager
- Three.js 0.186.1
- TypeScript 7.0.2
- oxlint 1.87.0 and oxfmt 0.72.0

These were the current npm `latest` releases when checked on October 6, 2026. Dependencies are pinned and `pnpm-lock.yaml` is committed.

## Run

Use Node.js 22 or newer (Node.js 24 is used in CI).

```sh
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000.

```sh
pnpm check       # oxlint, oxfmt check, TypeScript
pnpm format      # apply formatting
pnpm lint:fix    # apply lint fixes
pnpm build       # production build
pnpm test:e2e    # production browser tests (after playwright install chromium)
pnpm start           # serve production build
```

## shadcn/ui and UI preservation

All buttons, the search input, discovery badge, quiz card/title/content, and element fact cards use local shadcn/ui components. Their `unstyled` variant preserves the existing native element, class names, dimensions, focus treatment, CSS animations and pointer handlers. The standard shadcn variants remain available for future features. The custom theme menu, drawers, scene and scrubbers retain their current interaction behavior. The Three.js scene and original stylesheet are unchanged.

`components.json` and `lib/utils.ts` support the shadcn CLI (`pnpm ui:add <component>`). Preserve the custom `unstyled` variants when updating components; do not run an initializer that replaces the prototype theme or animations. The CLI is pinned to 4.21.1, a mature release accepted by pnpm's 24-hour minimum release-age policy.

## Explore

- Swipe horizontally across a period or vertically through a group. Arrow keys also navigate.
- Hold the scene to inspect proton/electron/neutron counts. Tap to bounce the atom.
- Drag the Period and Group controls; these controls also support keyboard navigation.
- Search by symbol, name, or atomic number.
- Open element details to inspect mass, phase, category, and idealised electron shells.
- Open the periodic table, pinch or Ctrl+wheel to zoom, discover elements, or take a quiz.
- Choose Auto, Midnight, Dusk, or Day from the theme menu. Escape closes panels.

Discovery progress, XP, quiz streak, and theme are saved in local storage using the original prototype's keys. Browser storage and vibration are optional. Reduced-motion preferences are respected. Electron shells are idealised, and the decorative 3D scene displays at most 12 orbiting electrons.

## Project structure

- `app/`: Next.js page, metadata, layout, Tailwind integration, and visual styles.
- `components/ui/`: owned shadcn component source with compatible unstyled variants.
- `components/elements-explorer.tsx`: React interface, progress, gestures, quiz, and panels.
- `lib/elements.ts`: element data, navigation, and idealised shell calculations.
- `lib/atom-scene.ts`: Three.js scene with renderer, texture, observer, and animation cleanup.
- `public/fonts/`: local fonts and their licenses; no Google Fonts requests.
- `docs/original-prototype.html`: archived HTML reference, excluded from tooling and app routes.
- `.github/workflows/ci.yml`: lint, formatting, types, production build, and browser regression tests on pushes and pull requests.

The lint configuration permits custom ARIA slider/dialog/group patterns that preserve the prototype's interface. Local comments document two post-hydration effects needed to restore browser storage and detect WebGL availability.

## CI/CD and deployment

GitHub Actions runs pnpm lockfile installs, code checks, production builds, mobile/desktop browser tests, CodeQL, and dependency review. Dependabot maintains dependencies and immutable action pins. Vercel production deployment runs after successful CI for the exact current main commit; native Vercel previews remain available for other branches.

See [the deployment guide](docs/deployment.md) for project setup, the three required GitHub secrets, repository protection recommendations, and rollback. Without the Vercel credentials, the deployment workflow reports a skipped deployment. No secrets are embedded in the code.

For local production hosting, use `pnpm build` and `pnpm start`. This App Router project is not configured as a GitHub Pages static export.

## Source and notices

The uploaded notes are retained in `PROTOTYPE-NOTES.md`. The original prototype code has no assigned license. Dependency licenses are listed in `THIRD-PARTY-NOTICES.md`.
