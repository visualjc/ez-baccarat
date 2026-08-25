---
run: 1qf3cz58
item: 7rfz93dh
status: success
summary: Rebuilt the app-shell/table-view UI, added pure UI state tests, and verified TypeScript, Bun tests, and Vite build all pass.
---

Implemented the dispatched recovery/finish pass for `docs/design/7rfz93dh.md`.

## What I did

- Replaced the truncated/broken UI wiring with a working vanilla TypeScript app shell and table view.
- Added the required typed count-panel seam in `src/ui/bus.ts` and kept the panel as a placeholder sibling region in `#panel-slot`.
- Rebuilt the table composition:
  - shell/header/status
  - shoe/discard/burn readout
  - player and banker hand zones
  - five bet spots
  - chip tray and bankroll persistence
  - outcome banner
  - burn ritual
  - dragon/panda celebration layers
  - keyboard controls
- Added a pure UI state module for wager/bankroll math so the engine settlement contract is consumed directly instead of re-derived.
- Added the required pure tests for:
  - wager/bankroll reducer behavior
  - seed query parsing/formatting
- Added the styling layer:
  - `src/styles/tokens.css` with the spec token block
  - `src/styles/anim.css`
  - `src/styles/app.css`
- Wired `src/main.ts` to mount the actual app and import styles.

## Verification

- `npx tsc --noEmit` ✅
- `env TMPDIR=/private/tmp /Users/jimcarter/.bun/bin/bun test` ✅
  - 33 passing tests
- `npx vite build` ✅

## Notes

- I did not modify `src/engine/`.
- The host did not have the `nahel` CLI installed, so I followed the task, constitution, glossary, and design document directly instead of using `nahel brief`.
- The count panel itself remains intentionally unimplemented for this item; the reserved dock, placeholder, and typed event seam are in place for the sibling panel item.
