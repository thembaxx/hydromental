# Elementals engineering handoff

Upgrade the existing explorer with tactile Bohr, illustrative quantum cloud, and
matter views; inertial rotation, excitation, a magnetic 1–118 scrubber, procedural
audio and optional haptics. Keep sourced element data, learning tools, navigation,
and readable content available when WebGL is loading or unavailable.

## Dependency constraints

Keep the existing lockfile and dependencies: Next.js 16.4.0, React 19.3.0,
TypeScript 7.0.2, Three.js 0.186.1, R3F 9.8.1, postprocessing 3.2.0,
GSAP 3.15.0, @gsap/react 2.1.2, motion 14.0.0 (`motion/react`), and
@phosphor-icons/react 2.1.10. Do not add dependencies or import drei.

## Architecture and accessibility

- Server-render the header, element identity, everyday uses and controls immediately.
  Hydrate only the deferred Canvas behind a non-blocking Suspense boundary.
- Respect reduced motion, sound/haptics preferences, hidden tabs and offscreen GPU
  suspension. Browser audio must only start after a user gesture.
- Provide labeled mode buttons, mute state, keyboard excitation, and a fully labeled
  slider with Arrow, Home/End and PageUp/PageDown support. Ignore global shortcuts
  in editable fields, dialogs, and modified key combinations.
- Use real shell populations and representative isotope counts. Explain that cloud
  density and matter arrangements are illustrations, not calculated orbitals or
  element-specific crystal structures. Keep unknown phase data explicit.

## Required checks

`pnpm format`, `pnpm check` (oxlint --deny-warnings, format:check, tsc --noEmit),
`pnpm test:unit`, `pnpm science:check`, `pnpm test:e2e` (including axe WCAG),
`pnpm build`, and `pnpm performance:check`.

Use Conventional Commits. The requested delivery is a verified commit on main.
