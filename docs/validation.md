# Verification of the shadcn/pnpm migration

- pnpm 12.9.1 installed the committed lockfile with its release-age policy enabled.
- oxlint, oxfmt, TypeScript and the Next.js production build passed.
- Mobile (390×844) and desktop (1440×900) baseline comparisons covered Auto/Day/Midnight/Dusk themes, the theme menu, search input, element details, periodic table and quiz: 18 states in total.
- For each state, native tags, classes, geometry, computed styles (including animation/transition timing, touch behavior and transforms), and settled screenshots matched exactly. The animated WebGL canvas was hidden for these UI screenshots; its source and the prototype stylesheet remained byte-for-byte unchanged.
- Playwright regression tests cover live WebGL, horizontal swiping, hold/release peeking, keyboard navigation, search, details, theme persistence, electron spreading, all 118 table cells, discovery XP, correct/incorrect quiz answers and closing pending quiz timers.
- GitHub Actions configuration was checked with actionlint and parsed as YAML. Vercel credentials are intentionally absent from source; live deployment requires account setup described in deployment.md.
