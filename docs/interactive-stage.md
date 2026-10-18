# Interactive element stage

The explorer at `/` and the reference library at `/elements` share the deferred
`ElementalCanvas`, `ElementalStage3D`, and `ElementalControlDock`. The header,
element identity, everyday uses, and controls render in the initial server HTML.
WebGL failure leaves a readable fallback and does not block element selection.

- **Bohr:** instanced protons and neutrons from a representative isotope, real
  neutral-atom shell populations, tilted rings, orbiting emissive electrons.
- **Cloud:** deterministic radial density sampling, additive points and swirl.
  This is an illustration, not a calculated probability-density solution.
- **Matter:** a 27-site solid arrangement, cohesive animated liquid, or dispersed
  translucent gas. Unknown phases use a wireframe illustration. These are not
  element-specific crystal structures.

Drag to spin with decaying inertia; tap or choose **Excite atom** for an energy
burst. The native range input covers all 118 elements and supports keyboard and
touch input. Forty surrounding ticks respond with motion springs. Left/right
step by atomic number, 1/2/3 change mode, and M toggles sound. Shortcuts defer to
editable fields and dialogs. Existing up/down table navigation remains available.

`lib/sound-engine.ts` plays locally hosted, tuned Sound Lab ticks, resonance cues,
and liquid pulses, with immediate procedural fallbacks and no new dependencies.
See the [sound palette and playback behavior](sound-design.md).
Sound starts muted and follows the existing explorer
preference. Haptics follow their separate preference and stop for reduced motion.
Reduced motion also disables automatic animation, springs, and bloom; rendering
pauses for hidden tabs, offscreen stages, and open explorer panels. The Canvas
caps DPR and can lower it automatically when measured rendering falls below 30 FPS.

No dependencies or lockfile entries were added. `CODEX_HANDOFF.md` records the
stack and required checks. The test build uses
`NEXT_PUBLIC_PRODUCT_EVENTS_ENABLED=true`, matching CI so the consented analytics
tests can exercise their stubbed endpoints. This flag is not a production setting
change; production still detects plan eligibility through its deployment workflow.
