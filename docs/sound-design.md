# Sound design

The optional effects use seven tuned exports from [React Bits Sound Lab](https://reactbits.dev/tools/sound-lab).
Short, warm controls leave room for exploration; success rises, while retry feedback falls gently.
These are interface cues, not physical recordings or simulations of elements.

| Interaction | Sound Lab preset | Pitch (st) | Tone | Length | Space | Volume (dB) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Buttons and enabling sound | Felt | 0 | -0.15 | 1 | -0.3 | -5 |
| Element scrubber | Notch | -1 | -0.2 | 0.85 | -0.6 | -8 |
| Element selection and model changes | Halo | -3 | -0.15 | 0.9 | -0.2 | -6 |
| Exciting an atom | Dew | -2 | -0.1 | 1 | -0.25 | -5 |
| Correct answers | Bloom | -2 | -0.15 | 0.8 | -0.25 | -6 |
| Incorrect answers | Shrug | -2 | -0.2 | 0.85 | -0.35 | -7 |
| Claiming a daily reward | Crest | -2 | -0.1 | 0.85 | -0.2 | -6 |

To reproduce an export, open Sound Lab with a hash containing the preset and tuning,
for example [the tuned Notch](https://reactbits.dev/tools/sound-lab#sound=notch&pitch=-1&tone=-0.2&length=0.85&space=-0.6&volume=-8).
Export Audio as WAV, 16-bit, 44.1 kHz, Mono. No added effects or variation are used.
The committed files in `public/sounds/` are resampled to 24 kHz PCM mono with:

```sh
ffmpeg -i exported.wav -ar 24000 -ac 1 -c:a pcm_s16le -map_metadata -1 public/sounds/preset.wav
```

`lib/sound-engine.ts` shares one effects context between exploration and learning.
It fetches and decodes the local palette on the first enabled gesture, never on
import or preference restoration. Existing procedural tones give immediate feedback
while exports load, and remain available if fetching or decoding fails. There is
no delayed playback when a download finishes. Scrubber and resonance cues are
rate limited, and concurrent voices are capped at twelve. Small bounded pitch
changes distinguish element interactions.

Effects start disabled. Muting stops active effects immediately. Hidden tabs stop
effects and suspend their context; another visible gesture resumes it. Cleanup
aborts pending downloads, closes the context, and clears decoded buffers. Ambient
audio retains its separate opt-in setting and quiet, theme-specific generated bed.
Haptics retain their independent preference and reduced-motion behavior.

The service worker caches the palette with the offline shell. Playback needs no
external host, new audio package, or sound-library JavaScript. Tests cover the
sample budget and encoding, opt-in, fallback, mute, hidden tabs, cleanup, voice
limits, and real browser decoding and playback on desktop and mobile layouts.
