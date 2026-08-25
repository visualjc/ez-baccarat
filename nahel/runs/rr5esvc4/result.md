---
run: rr5esvc4
item: dh6xeqdg
status: partial
summary: Added README, GitHub Pages workflow, and environment-driven Vite base; equivalent build passed but Bun is unavailable.
---

Implemented the requested closeout artifacts:

- Added `README.md` with the game overview, deployed GitHub Pages URL, local Bun
  commands, WoO-attributed Dragon 7/Panda 8 count table, trainer/casino mode,
  seeded-shoe usage, and Nahel role/model routing attribution.
- Added `.github/workflows/pages.yml` to build and deploy `dist/` on pushes to
  `main`, with the required Pages permissions, environment, Bun setup, and
  `BASE_PATH=/ez-baccarat/` build setting.
- Added `vite.config.ts`, where `BASE_PATH` determines the Vite base and
  defaults to `/` for local development.

Verification:

- `bun run build` could not be run because `bun` is not installed in this
  worker environment (`command not found: bun`).
- The equivalent installed pipeline passed instead:
  `BASE_PATH=/ez-baccarat/ ./node_modules/.bin/tsc --noEmit && BASE_PATH=/ez-baccarat/ ./node_modules/.bin/vite build`.
- Generated `dist/index.html` references assets under `/ez-baccarat/`,
  confirming the Pages build base is applied.

No git commit was created. The only remaining check is to run `bun run build`
on a machine with Bun installed.
