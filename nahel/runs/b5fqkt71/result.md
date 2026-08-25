---
run: b5fqkt71
item: 9x1w62ms
status: success
summary: Fixed deal order, standardized settlement payout convention, and cleaned type/config debt by removing dead code and adding bun type-check support.
---

## Finding 1 — DEAL ORDER (Player–Banker–Player–Banker)

- Updated `src/engine/engine.ts` so initial dealing now draws in canonical Punto Banco order: Player, Banker, Player, Banker.
- Added `result.seenThisRound`-based ordering assertion in `src/engine/engine.test.ts` with a seeded-control setup to verify the exact hand assignment sequence from a known seeded shoe.

## Finding 2 — SETTLEMENT CONVENTION (single signed net per wager)

- Updated `src/engine/rules.ts` payouts to a consistent convention:
  - Player/Banker main: win `+1`, lose `-1`, tie push where applicable.
  - Tie main: win `+8`, otherwise lose `-1`.
  - Dragon side: win `+40`, otherwise lose `-1`.
  - Panda side: win `+25`, otherwise lose `-1`.
- Kept banker main special-case for Dragon 7 as push (`0`).
- Extended `settlement` tests in `src/engine/engine.test.ts` to assert loss paths for:
  - Player loss against Banker (both player main/side losses).
  - Banker Dragon win path (banker tie/dragon/panda side losses where relevant).
  - Tie path (player and banker losses, side losses).

## Finding 3 — TYPE CLEANLINESS / BUILD GATE

- Removed dead exports from `src/engine/shoe.ts`: `normalizeCardSequence`, `rankFromValue`, `isNatural`.
- Updated `src/engine/engine.test.ts` imports to stay in sync with the deck-order red-first assertion (uses `drawCard` for control shoe sequencing).
- Updated `tsconfig.json` types to include `bun-types`.
- Added `bun-types` to `devDependencies` in `package.json`.
- Changed `package.json` build script to `tsc --noEmit && vite build` so type checking gates the build.

## Notes

- Did not run test/typecheck commands in this environment.
- No additional implementation items were modified outside this task scope.
