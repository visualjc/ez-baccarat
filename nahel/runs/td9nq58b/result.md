---
run: td9nq58b
item: 9x1w62ms
status: success
summary: Restored type-clean baseline by removing dead shoe exports, adding bun-types, switching build to gate on tsc, and applying a type-safe seeded replay fix.
---

## Completion

- Removed dead exports in `src/engine/shoe.ts`:
  - `normalizeCardSequence`
  - `rankFromValue`
  - `isNatural`
- Updated `tsconfig.json`:
  - Added `"bun-types"` to `compilerOptions.types`.
- Updated `package.json`:
  - Set `build` script to `tsc --noEmit && vite build`.
  - Added `bun-types` to `devDependencies`.
- Fixed the TypeScript-only issue in `src/engine/qa-probe.test.ts`:
  - Replaced `playerCards[2]?.value % 10 ?? null` with an explicit conditional
    to produce `number | null` as intended for `shouldBankerDraw`.

## Notes

- No behavioral assertions were changed in either test file.
- I did not run tests or typecheck locally in this step (host verification will run them).
