---
run: 7xn42bys
item: fc5v6szj
status: success
summary: Counted the exposed burn at shoe open and kept opening-round trace display without double-counting.
---

Implemented the accepted Terra finding in the engine.

- `createEngine` now advances the count with the exposed burn card immediately and exposes the resulting `countState` and `countSignals` on `EngineState`. The pre-first-hand recommendation therefore includes the seen burn card.
- `dealRound` advances that existing state with only cards revealed during the round, so the opening burn is not counted twice.
- `seenThisRoundForCounts` still puts the burn card first on round one for the count-explanation display.
- Added a red-first seam test using an exposed 9 to assert running counts, true counts, and both signals directly after opening. Updated the prior seam test to prove opening state plus only the new round cards produces the stored post-round state.

Verification:

- Engine-only TypeScript check passed:
  `./node_modules/.bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck src/engine/engine.ts`
- `git diff --check` passed.
- Bun is not on PATH, as specified, so the Bun suite was left for host verification.
- Repository-wide `tsc --noEmit` is currently blocked by an unrelated pre-existing syntax error in untracked `src/ui/game.ts:256` (`shell.controls.chips?.;`), outside this engine-counts fix.

I could not run `nahel brief` or journal an event because the `nahel` CLI is unavailable in this environment.
