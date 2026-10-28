# Portfolio launch review — 28 October 2026

Elementals is a portfolio science playground by [thembaxx](https://github.com/thembaxx), evolved from a supplied interactive prototype. It connects interactive element models to sourced explanations, quizzes, games and a learner-owned journal. It has no account, cloud sync or claim of measured learning outcomes.

Public entry points: [application](https://hydromental.vercel.app/), [project notes and help](https://hydromental.vercel.app/about), [readable oxygen reference](https://hydromental.vercel.app/elements/oxygen), [source](https://github.com/thembaxx/hydromental). The `/about` route is added by this launch change and becomes live after deployment of the merged commit.

## Launch changes

- Fresh journals begin with zero discoveries and XP. Existing v2 and original legacy progress are retained. The prototype’s twelve prefilled discoveries no longer appear as a new visitor’s work.
- Opening an element’s details records a discovery, shows its sourced properties and offers a quick quiz, including through workspace tabs and direct panel links. Quizzes use discovered elements as soon as the learner has one, so a first oxygen exploration can be followed by oxygen practice. XP measures activity, not a qualification.
- Before a save with unreadable JSON, invalid core progress fields or a newer version is replaced, its exact original contents are retained in a separate browser key. Settings offers a raw download for manual recovery. If retaining it fails, the app refuses to overwrite it and continues in memory. A validated exported progress JSON remains the supported restore format.
- Settings explains local storage and provides an explicit two-action reset. Reset removes only named learning, preference, investigation and recovery keys. Optional measurement consent remains separately managed. Close other app tabs before resetting to avoid an older session writing its state back.
- Project notes and help explain the first activity, backups, separate investigation exports, keyboard controls, rendering limitations, privacy and support. A route error boundary offers retry and readable references.
- Preview keyboard handlers ignore bubbled child events. Accessible names retain the visible identity, fullscreen, aura, search-result and table-cell text. Inline reference links are underlined. Browser checks accept an explicit port so independent production apps can be verified without replacing another server.

## Verification scope

Verification uses Node 24.19.0 and pinned pnpm 12.9.1, a frozen lockfile install and a local production Next.js build. Chromium runs against port 3103 with one worker and software WebGL. Automated checks cover real interactions and storage boundaries; they are not physical-device, assistive-technology or classroom validation.

Browser checks exposed an inline link without a non-color distinction and controls whose overriding accessible names omitted visible text. The link was underlined and the reported names were corrected without changing the Axe rules. The import-feedback assertion now targets its own section rather than two separate status regions. Software WebGL workflows exceeded the default 30-second timeout on this two-core runner; launch journeys and the specific popup/focus workflow use a bounded 60-second limit.

Local static checks pass: lint, formatting, TypeScript, **72/72 unit tests**, all **118 science records**, all four model assets and the explorer JavaScript budget. Browser and build results below are limited to the local production app; no deployment or hosted-release verification is included.

| Final check | Result |
| --- | --- |
| Frozen lockfile install and `pnpm check` | Passed |
| `pnpm test:unit` | 72 passed |
| `pnpm science:check` and `pnpm assets:check` | 118 science records and four models passed |
| `pnpm build` and `pnpm performance:check` | Passed; initial explorer JavaScript is 435.4 KiB gzip against a 450 KiB budget |
| `tests/portfolio-launch.spec.ts` | 12 passed across mobile and desktop |
| `tests/wcag.spec.ts` | Six passed across mobile and desktop with unchanged Axe rules |
| Focused existing import, popup/focus, aura, fullscreen and table workflows | Ten passed across mobile and desktop |
| Android Chromium touch workflows | Six passed |

Final browser runs use one worker, zero retries and have no failures or skipped tests. The full 234-test Chromium matrix is left to CI. iOS/WebKit was not run locally because this host lacks its required GTK/Graphene system libraries; these checks do not establish physical-device or assistive-technology support.

## Dependency audit

Compatible transitive overrides update undici 6.29.1 and 7.30.1, zod 4.6.6 and fast-uri 3.1.9. The frozen install and CLI contract tests verify the pinned deployment tooling. No unrelated dependency upgrade or new advisory exception is included.

The baseline main commit `31991eb` already failed its [CI dependency audit](https://github.com/thembaxx/hydromental/actions/runs/40645178207/job/122672523328) with **18 findings: 2 low, 8 moderate and 8 high**. This branch reduces that to the single development-tool finding described below. Main also failed lint on the preview’s keyboard region; the semantic region and child-event guard in this change pass local lint.

The production-only audit (`pnpm audit --prod`) reports **no known vulnerabilities** on 28 October 2026. The full audit still fails with one **high** advisory: [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), affecting zod 3.22.4 under the development-only Vercel CLI 65.0.0 builders. Paths include `vercel → @vercel/backends`, `@vercel/express`, `@vercel/hono` and `@vercel/python-analysis → zod`. Upstream marks all versions below 4.6.6 affected and has no compatible v3 fix. A cross-major override or unreviewed backport is deliberately not applied. The high-severity CI audit continues to fail until upstream resolves this chain or the maintainer reviews a separate mitigation.

## Limits and follow-up

- Progress is browser-local. Imports replace the current record; export first. Raw recovery files may require manual repair. Investigation notes have a separate report export.
- Reset is scoped to the current browser. Other open app tabs should be closed first. Exported files remain under the learner’s control.
- Bohr rings, cloud density, matter arrangements and nuclei are teaching illustrations with the limitations shown in the app. Reference values have source conditions and missing-value disclosures.
- A software WebGL run does not establish smooth animation on physical low-end phones. No frame-rate, Core Web Vitals, classroom impact or usage claim is made here.
- This document records local branch verification. No production deployment or hosted-release verification was performed.
