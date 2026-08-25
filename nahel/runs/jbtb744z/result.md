---
run: jbtb744z
item: fc5v6szj
status: success
summary: Tag tables/true-count/thresholds/round-trace math all check out against PRODUCT.md; one tautological test assertion found, one signal-wiring coverage gap
---

# Adversarial review — engine-counts (item fc5v6szj)

Reviewed `src/engine/counts.ts`, `src/engine/counts.test.ts`, the counting seam
in `src/engine/engine.ts` + `engine.test.ts`, against PRODUCT.md "Domain
facts" (lines 17–35). No code modified.

## Verified correct (no flaw)

- **Tag tables**, `src/engine/counts.ts:7-37` — Dragon (`4,5,6,7→-1; 8,9→+2;
  A,2,3,T,J,Q,K→0`) and Panda (`T,J,Q,K,A,2→+1; 3,4,5,8→-2; 6,7→-1; 9→+4`)
  both match PRODUCT.md:25-30 exactly, rank-for-rank. `counts.test.ts:18-66`
  checks every rank against an independently-written expected map and asserts
  exhaustiveness (`Object.keys(...).toHaveLength(RANKS.length)`) — solid.
- **True count**, `counts.ts:74-141` — `unseen = totalCards(416) - seenCount`,
  `decksRemaining = unseen/52`, `true = running/decksRemaining`. Matches
  PRODUCT.md:26-27 ("running ÷ decks remaining") exactly. Face-down burn
  cards (`unseenBurnCards` in `engine.ts:27-45`) are never added to
  `seenThisRoundForCounts` and so never increment `seenCount` — they stay in
  the unseen pool forever, matching PRODUCT.md:33-34 ("face-down burns are
  unseen and never counted... mathematically identical to cards behind the
  cut card"). The exposed burn card *is* prepended to
  `seenThisRoundForCounts` only on `roundsPlayed === 0` (`engine.ts:97-99`),
  correctly counted.
- **Thresholds**, `counts.ts:116-122` — `isDragonBetSignal: true >= 4`,
  `isPandaBetSignal: true >= 11`, both `≥` per PRODUCT.md:27,29.
  `counts.test.ts:68-77` boundary-tests both edges (3.99/4, 10.999/11)
  directly — correct and not degenerate.
- **Round trace hand-check**, `counts.test.ts:79-107` — hand-verified:
  cards A,9,2 → dragon tags 0,2,0 = running 2; panda tags 1,4,1 = running 6.
  `decksRemaining = (416-3)/52 = 413/52`. `dragon.true = 2/(413/52) =
  104/413 ≈ 0.2518`, `panda.true = 6/(413/52) = 312/413 ≈ 0.7554`. Both
  below threshold → signal false. Matches the test's expectations and the
  `toBeCloseTo` assertions exactly. Burn-count arithmetic in
  `shoe.ts:91-93` (`burnCountForCard`) also matches PRODUCT.md:31-32
  (A=1, 2-9=face value, T/J/Q/K=10) and was hand-traced through the
  `engine.test.ts:238-263` seam test (A exposed → burn count 1 → K burned
  face-down → excluded from `seenThisRoundForCounts`, confirmed by
  elimination since the array is `[A, 9,T,8,Q,7]`, 6 elements, matching
  1 burn card + 5-card round).

## Flaws found

1. **`src/engine/engine.test.ts:261-262` — tautological assertion, cannot
   fail.**
   ```ts
   const counts = advanceRoundCountState(createInitialCountState(), result.seenThisRoundForCounts);
   expect(counts.state.seenCount).toBe(result.seenThisRoundForCounts.length);
   ```
   `advanceRoundCountState` computes `seenCount = before.seenCount +
   seenThisRound.length`. Starting from `createInitialCountState()`
   (`seenCount: 0`), this is `0 + array.length === array.length` by
   construction — true regardless of what the tag tables, running counts, or
   burn-card handling actually do. It doesn't assert on `dragonRunning`,
   `pandaRunning`, or `decksRemaining` at all. This is the only place in the
   suite where the burn-seam (`seenThisRoundForCounts`) is fed through
   `advanceRoundCountState`, and the one assertion made there is guaranteed
   to pass — so the actual arithmetic effect of the burn card entering the
   running counts (e.g. dragon +0, panda +1 for the "A" in this fixture) is
   never checked end-to-end.

2. **`src/engine/counts.ts:124-141` (`stateSignal`) — signal-true path never
   exercised through the integration surface it's actually used by.**
   `counts.test.ts:68-77` tests `isDragonBetSignal`/`isPandaBetSignal`
   directly with literal numbers (correct in isolation), but the only test
   that runs a value through `stateSignal` — the round-trace test at
   `counts.test.ts:79-107` — produces counts too small to cross either
   threshold, so both `before`/`after` signals are `false` throughout. No
   test drives `advanceRoundCountState`/`stateSignal` to a state where
   `trueCount` actually crosses +4 or +11 and confirms `signal` flips to
   `true` through the wiring that's shipped (as opposed to calling the
   predicate functions standalone). A cross-wiring bug in `stateSignal`
   (e.g. swapped threshold predicate per side) would not be caught by the
   current suite as long as it left `dragonRunning`/`pandaRunning` values
   themselves correct — which the existing assertions do check. Lower
   severity than #1 since running values are cross-checked, but the
   signal-flip path itself is unverified.

Minor, not counted as a flaw: `validateTagTables` (`counts.ts:184-191`) is
exported but never imported/called anywhere in the test suite — dead code,
not incorrect.

## Verdict

Domain math (tag tables, true-count formula, burn handling, thresholds) is
correct and matches PRODUCT.md's normative domain facts on every axis
attacked. The defects are test-quality gaps, not engine bugs: one assertion
that cannot fail (finding 1) and one integration path (signal-true) that no
test reaches (finding 2).
