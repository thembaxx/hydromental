# Mobile verification and asset budgets

`pnpm test:devices` runs actual Chromium and WebKit engines with Pixel 7 and iPhone 13 touch/viewport profiles. These are browser emulations on a computer, not physical phones. CI installs both browser engines and system dependencies. The suite checks readable science/isotope tables, page overflow, consent defaults, touch navigation and WebGL/fallback access. The broader browser suite checks actual GPU uniform writes, touch ripples, reduced motion, offscreen draw suspension, offline caching and accessibility.

`pnpm performance:check` rejects production initial explorer scripts above 450 KiB gzip. Returning visitors load the introduction's independent Three.js scene only when replayed; the elemental scene and optional measurement SDKs load separately. This budget excludes lazy chunks, CSS and image assets and is not a substitute for field LCP/INP/CLS. `pnpm assets:check` enforces self-contained GLB v2 assets under 1 MiB and 100,000 triangles, without unconfigured external compression decoders.

The loader clones and centers complete scene hierarchies, applies transforms, fits rest-pose bounds, supports skinned meshes and animations, and preserves authored materials when configured in `lib/elemental.ts`. Procedural aura material remains the default. Authored mode includes neutral hemisphere/directional lighting for PBR materials. Skinned and morph deformation require authored mode; the procedural aura shader does not implement those deformation chunks. Textures/buffers must be embedded in GLB files for offline use. The selected animation is named in the asset configuration or defaults to the first clip; reduced motion and pause stop animation. Animated poses can exceed rest-pose bounds and need visual review. Shared loader textures remain cache-owned; cloned geometry/materials are disposed on unmount.

Rendering pauses when the scene is outside the viewport, a sheet covers it, or the document is hidden. Reduced motion uses demand rendering. Adaptive mode reduces DPR after a sustained low frame rate; detailed bloom remains an explicit quality choice.

Before declaring physical-device readiness, record these results on an actual iPhone/Safari and a lower-memory Android/Chrome:

| Check | Evidence to record | Status |
| --- | --- | --- |
| Touch/pinch/scroll | Browser/OS/device, missed gestures, scroll conflicts | Pending physical device |
| Sustained GPU use | At least 5 minutes, frame rate, thermal slowdown, quality fallback | Pending physical device |
| Offline and updates | Install, fully cache, airplane mode, reload all auras, apply new worker | Pending physical device |
| Native installation | Home-screen launch, safe areas, browser chrome, status bar | Pending physical device |
| Accessibility | VoiceOver/TalkBack, zoom, reduced motion, external keyboard | Pending physical device |
| Network and battery | Slow connection/startup, memory pressure, background/resume | Pending physical device |

Cloud-browser results do not fill these rows. The application remains usable through the static fallback if WebGL is unavailable.
