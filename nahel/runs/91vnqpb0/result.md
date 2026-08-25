---
run: 91vnqpb0
item: 9x1w62ms
status: success
summary: Adversarial review found missing count mechanics, noncanonical deal order, inconsistent payout losses, and TypeScript errors.
---

## Findings

1. **P0 — Required Dragon/Panda counting trainer mechanics are entirely absent.** `src/engine/card.ts:16-20` has no Dragon/Panda tags, and `src/engine/engine.ts:14-28,55-108` returns only exposed cards and settlement: it never maintains running counts, computes true counts from unseen cards / 52, applies the +4/+11 signals, includes the exposed burn in counts, or emits the required per-card before/after count trace. This directly misses PRODUCT.md Domain facts and PRD F1.5–F1.6 / hard constraint 2. `src/engine/engine.test.ts` also has no tag, true-count, threshold, burn-counting, or trace test, despite the PRD acceptance criteria requiring them.

2. **P1 — The round is dealt in the wrong physical/card-order sequence.** `src/engine/engine.ts:64-67` takes Player, Player, Banker, Banker. Punto banco requires Player, Banker, Player, Banker. Although an unbiased shuffled shoe preserves aggregate odds, this makes every seeded/controlled shoe produce noncanonical hands and makes `seenThisRound` (`src/engine/engine.ts:68-71`) unsuitable as the required ordered exposure trace/animation source. The tests never assert the order in which a known shoe is assigned to hands, so this defect can pass all 149 expectations.

3. **P1 — Settlement represents a losing main wager as `-1` but a losing Tie/Dragon/Panda wager as `0`.** `src/engine/rules.ts:76-86` uses signed net values for Player and Banker, then returns `0` for a non-winning Tie or side bet. If these `*Payouts` are used to settle wagers, losing Tie/Dragon/Panda bets never lose their stake; if they instead mean winnings-only, Player/Banker must not be `-1`. The interface needs one consistent convention. `src/engine/engine.test.ts:146-180` only checks winning side-bet/tie amounts and never asserts any side-bet loss, so it cannot catch the bankroll-impacting path.

4. **P1 — The TypeScript project fails a no-emit type check.** `src/engine/shoe.ts:123,125` references `Rank` without importing it, yielding TS2304. The test also imports `bun:test` at `src/engine/engine.test.ts:1` without its type declarations available to TypeScript (TS2307). I ran `./node_modules/.bin/tsc --noEmit`; it reported both errors. The advertised test command can still pass because Bun transpiles the tests without proving the project type-checks. The transcript reports only `bun test`, Vite serving `index.html`, a healthcheck, and doctor—not a type check or production build.

5. **P2 — The supplied “verify-by-driving” evidence does not execute the engine.** The transcript’s only browser evidence is the Vite document head (`engine-core-transcript.txt:7-19`). `src/main.ts:1-6` merely renders “engine under construction” and neither creates nor deals an engine. This is understandable for a scaffold, but the transcript should not be treated as evidence that a playable or engine-integrated app was driven.

## What I checked

- Read the assigned task, PRODUCT.md domain facts, CONTEXT.md, PRD, full `src/engine/*.ts`, full test file, commit stat/diff, and the supplied implementation transcript.
- Checked the tableau itself: `shouldBankerDraw` implements the standard cells correctly, including Banker 3 standing against player-third 8 and Banker 6 drawing only on 6/7.
- Checked settlement flags: Dragon and Panda eligibility conditions, 40:1/25:1 wins, Dragon Banker push, and tie main-bet pushes are otherwise correctly expressed.
- `nahel brief` could not be run because the `nahel` executable is unavailable in this shell; no code was modified.

## Required follow-up

Implement the count domain model and round trace, correct initial deal order, define/consistently test settlement return semantics for every losing wager, and make `tsc --noEmit` clean before accepting the reported test/drive evidence.
