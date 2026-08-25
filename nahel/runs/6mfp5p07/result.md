---
run: 6mfp5p07
item: h7g4w2rg
status: success
summary: Guarded all live chip placement against aggregate committed wagers and made negative bankroll settlement an invariant failure.
---

Implemented the bankroll-limit fix.

- `src/ui/table-view.ts` now installs a placement predicate that evaluates every chip against the current bankroll and the total already committed across all five spots. This applies to both pointer placement and the keyboard path, which delegates to `table.placeBet`.
- Rejected placements preserve wagers and use the existing visible feedback: the denied spot flashes and the shell announces `Wager exceeds bankroll.`
- `applyBankrollDelta` now throws a `Bankroll invariant violated` error instead of clamping a negative settlement to zero.
- Added `src/ui/bet-layout.test.ts` for scripted boundary, denial/state-unchanged, cross-spot aggregate, feedback, and direct placement-path coverage. Updated reducer tests for the same bankroll invariant and settlement assertion.

Verification:

- `/Users/jimcarter/.bun/bin/bun test` — 65 pass, 0 fail, 3,142 assertions.
- `./node_modules/.bin/tsc --noEmit` — pass.
- `git diff --check` — pass.

No commit was created. `nahel` was not available on PATH, so I could not run its brief/status/log/validate commands; the required result is recorded here directly.
