# Interactive atom studies and 3D lab

The October 19, 2026 redesign brings the element reference, playground and periodic table into the same tactile visual system. It uses the existing Three.js, React Three Fiber and Motion dependencies. All models and studio lighting are procedural; no remote model downloads are required.

## Try the complete flow

1. Open an element's details or its public reference page. Orbit the new studio-lit nucleus and electron shells. Expand the view to fill the screen; the current rotation, zoom and shell spread carry over.
2. Drag to rotate, pinch or scroll to zoom, and tap to excite. Keyboard users can focus the model and use arrow keys, plus/minus and Enter. The toolbar offers pause, excitation, shell spread, zoom and reset. Sound starts only after selecting **Enable atom sounds**.
3. Open `/playground`. Turn the live specimen, switch between water, carbon dioxide and ammonia, or tap an atom to inspect it. **Start building** opens that molecule in free play.
4. Filter the eight experiments into **Build in 3D** or **Puzzles & discovery**. Model games retain their explicit atom-placement controls, camera buttons, saved creations and sourced explanations.
5. Open the element library's periodic table. The current element starts in view. Read the element name and family in the inspector, resize the cells, pan across all 18 groups, or navigate with arrow keys and Home/End. Enter selects an element.

## Product Design review

The design work followed the Product Design context and audit workflow. The baseline showed a card-only playground, tightly packed mobile game controls and a periodic table whose current element could open outside the visible area. The changes prioritize a first usable interaction, readable controls and feedback on the action itself.

| Surface | Change | Intended gain |
| --- | --- | --- |
| Element details | PBR ceramic nucleus, thin orbital rings and full viewport study | Make the model feel tangible while keeping scientific counts visible |
| Playground entry | Real interactive specimen, direct build action and experiment filters | Let visitors try 3D immediately and find a suitable activity |
| Model games | Larger scene, separate 44px camera controls and spring landing feedback | Keep model interaction and answer controls usable on touch screens |
| Periodic table | Named cells, family accents, focused-element inspector and visible zoom tools | Retain scientific spatial layout while improving mobile readability |
| Feedback | Damped rotation and zoom, shell spreading, spring entrances and solved-state accent | Tie movement and visual state to the user's action |

### Visual evidence

The images below are captured from the app. Before images show the prior implementation; after images show the production build. Screenshots establish appearance at the captured viewport. Gesture, focus, persistence and accessibility claims are checked separately by browser tests.

- [Previous mobile playground](interactive-lab/before-playground-mobile.png)
- [Updated mobile playground](interactive-lab/after-playground-mobile.png)
- [Playground at 320px](interactive-lab/after-playground-320.png)
- [Updated desktop playground](interactive-lab/after-playground-desktop.png)
- [Previous mobile game](interactive-lab/before-game-mobile.png) and [updated model workspace](interactive-lab/after-game-mobile.png)
- [Previous mobile element details](interactive-lab/before-details-mobile.png)
- [Updated fullscreen atom on mobile](interactive-lab/after-fullscreen-mobile.png)
- [Updated periodic table on mobile](interactive-lab/after-table-mobile.png)

## Motion, sound and scientific limits

Rotation integrates exponential drag; zoom, excitation and shell spreading use substepped damped springs. Pause and live reduced-motion preferences stop automatic movement while preserving direct manual controls. Scenes stop drawing when offscreen or in a hidden tab; paused atom studies render on demand. GPU failure leaves the sourced reference and semantic game controls available.

The atom study renders the exact neutral shell populations and the proton/neutron counts of the representative isotope used elsewhere in the app. Rings depict shell counts, not electron trajectories. Sizes and distances are illustrative. Molecules retain their authored geometry and bonding notes; these animations are interface feedback rather than molecular dynamics simulations.

Audio uses the existing local Sound Lab clips with procedural fallback. It is opt-in, can be muted immediately, and stops when the page is hidden. Native device fullscreen is offered only where supported; the expanded dialog remains available independently.

## Verification

`tests/model-motion.test.mjs` checks stable springs, frame-independent drag, pause behavior and nucleus populations. `tests/immersive-lab.spec.ts` checks the full viewport, keyboard control, actual rendered rotation, two-finger pinch, experiment filters, current-cell positioning, focus restoration and WCAG scans. `device-tests/immersive-lab.spec.ts` exercises portrait/landscape touch and the 320px lab workflow in Chromium and WebKit.

Run the required code, science, production, browser, device and performance checks documented in [Validation](validation.md). Emulated mobile browsers do not establish physical-device GPU performance or haptic behavior.
