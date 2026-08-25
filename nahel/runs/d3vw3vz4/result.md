---
run: d3vw3vz4
item: fc5v6szj
status: success
summary: Found a first-hand exposed-burn count timing defect and its test gap.
---

## Finding

1. **High — the exposed burn card is counted too late for the opening-hand decision.**  
   [src/engine/engine.ts:97](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/engine/engine.ts:97) only prepends `exposedBurnCard` to count input inside `dealRound`. A fresh shoe's exposed burn is seen when `createEngine` opens the shoe, and the domain definition requires it to update both running counts. Deferring it until `dealRound` means the live count / true count / bet signal immediately before the first hand still omits that seen card. That can make the Dragon 7 or Panda 8 recommendation for the opening hand wrong, particularly at a threshold boundary.

   The first-round trace can still display the card, but it should be incorporated into initialized count state before a player decides whether to make the first side bet; it must not be first applied after the hand's cards are exposed.

2. **Medium — the counting-seam test permits the timing defect.**  
   [src/engine/engine.test.ts:238](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/engine/engine.test.ts:238) calls `dealRound` before it asserts the exposed burn card reaches the count input, then only checks the resulting `seenCount`. It never verifies count state or a bet signal directly after shoe opening, before the first hand. Consequently, the test passes whether the burn is counted at shoe open (correct for the opening decision) or only after `dealRound` (current behavior).

## Checks completed

- Dragon tags exactly match 4–7 = -1, 8/9 = +2, otherwise 0.
- Panda tags exactly match A/2/T–K = +1, 3/4/5/8 = -2, 6/7 = -1, 9 = +4.
- True-count arithmetic uses `(416 - seen) / 52`; face-down burns remain out of `seenCount` and therefore unseen.
- Threshold predicates are inclusive at +4 and +11.
- The supplied round-trace case hand-checks: A, 9, 2 changes Dragon by +2 and Panda by +6, with post-round denominator `(416 - 3) / 52`.
- The supplied transcript reports `bun test` (25 tests / 286 expectations) and `tsc` passing. I did not modify application code.
