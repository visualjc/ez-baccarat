---
run: wxqa5c2c
item: 9x1w62ms
status: partial
summary: Tableau/settlement/burn math verified correct against PRODUCT.md; found one confirmed compile-time bug and two real test-coverage gaps
---

# Adversarial review — engine-core (9x1w62ms)

## Method

Read `git show HEAD --stat`, `PRODUCT.md` Domain facts, all of `src/engine/*.ts`
and `src/engine/engine.test.ts` in full, and the drive transcript at
`nahel/runs/ekq4swkd/artifacts/build-review/implement/dev/engine-core-transcript.txt`.
Also independently ran `bun test`, `npx tsc --noEmit -p tsconfig.json`, and
`bun run build` to check claims rather than trust the transcript alone.

## Game math verdict: correct

Checked line-by-line against PRODUCT.md's Domain facts:

- **Tableau** (`rules.ts:30-54`): player draws on 0-5 stands 6-7
  (`shouldPlayerDraw`, `rules.ts:26-28`) — correct. Banker table
  (`shouldBankerDraw`) matches the standard tableau exactly for every banker
  total 0-9 × player-third 0-9 cell (verified against the exhaustive test
  `engine.test.ts:110-130`, and re-derived by hand): ≤2 always draws, 3 draws
  unless player-third=8, 4 draws on 2-7, 5 draws on 4-7, 6 draws on 6-7,
  ≥7 never draws. Banker-stood case (`playerThirdValue === null` →
  `bankerTotal <= 5`) also correct.
- **Naturals**: `engine.ts:75` stops both hands on `playerTotal >= 8 ||
  bankerTotal >= 8`, matching "natural = 8 or 9" and short-circuiting all
  further draws — correct.
- **Settlement** (`rules.ts:56-104`): no-commission banker win pays 1:1
  (`bankerMainPayout` branch); Dragon 7 requires banker win **and**
  `bankerCards.length === 3` **and** total 7 (`rules.ts:64`) — correctly
  excludes a 2-card banker stand-on-7 from Dragon, matching "three-card
  Banker total of 7" in PRODUCT.md, and correctly pushes (payout 0) rather
  than paying the main bet when Dragon fires. Panda 8 mirrors this for the
  player side but, per domain facts, does **not** push the player main bet
  (25:1 side bet stacks on top of the normal 1:1 win) — implemented exactly
  right (`rules.ts:65,86`). Tie pushes both mains and pays 8:1 (`rules.ts:84`,
  `isTie ? 0` for player/banker) — correct.
- **Burn procedure** (`shoe.ts:91-93,95-110`): exposed card drawn first,
  `burnCountForCard` = value with 10 for T/J/Q/K and 1 for Ace
  (`card.value === 10 ? 10 : Math.max(1, card.value)`), that many further
  cards drawn face-down into `unseenBurnCards` and never surfaced elsewhere —
  matches "A=1, 2-9=face value, T/J/Q/K=10" exactly, and correctly
  distinguishes the one exposed (countable) card from the unseen burns.
- **Seeded determinism**: `rng.ts`'s xmur3+mulberry32 pair is deterministic
  per seed; `engine.test.ts:184-195` replays 3 rounds from two engines built
  with the same seed and diffs the full transcript (cards, outcome, flags,
  retirement) — this is a real, falsifiable check, not tautological.
- **Cut-card retirement**: traced `engine.test.ts:197-234` by hand including
  the 2 cards the burn procedure consumes before round 1 starts — the round
  that crosses `cutIndex` sets `retireAfterCurrentRound` mid-round and
  `finalizeRound` applies it after settlement, and a subsequent `dealRound`
  correctly throws `"shoe retired"`. Confirmed by running `bun test` (9 pass,
  149 assertions).

No count-system logic exists in this diff (Dragon 7 / Panda 8 running/true
counts) — correctly out of scope per the change summary; not evaluated
against the count-related domain facts.

## Flaw 1 (confirmed) — dead code with a live compile error, invisible to "suite green"

`src/engine/shoe.ts:123` and `:125`:

```ts
export function rankFromValue(value: number): Rank {
  const normalized = ((value % 10) + 10) % 10;
  return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T"][normalized] as unknown as Rank;
}
```

`Rank` is never imported in this file (`shoe.ts:1` only imports `Card`).
Confirmed by running `npx tsc --noEmit -p tsconfig.json`:

```
src/engine/shoe.ts(123,47): error TS2304: Cannot find name 'Rank'.
src/engine/shoe.ts(125,87): error TS2304: Cannot find name 'Rank'.
```

This function, plus `normalizeCardSequence` (`shoe.ts:119`) and `isNatural`
(`shoe.ts:128`), are exported but **never imported or called anywhere** in
`src/` or the test file (grep confirms zero call sites) — dead code, and
`isNatural` duplicates the natural-check `engine.ts:75` reimplements inline
instead of reusing.

Why this shipped green: `bun test` and `bun run build` (`vite build`, plain
esbuild transpile) both strip types without type-checking, so both "pass"
with this error present — confirmed by running `bun run build` myself
(succeeds, 42ms). The drive transcript's verify-by-driving evidence
(`bun test`, curl on dev server, healthcheck, `nahel doctor`) never runs a
type-check, so "suite green... doctor exit 0" gives no assurance the code
type-checks. PRODUCT.md hard constraint 1 requires exact game math with "no
simplified or approximate rules" — this particular bug is in dead helper
code, not live game math, so the shipped *behavior* is unaffected today, but
it's a live regression waiting for whoever next imports `rankFromValue` or
adds a `tsc` gate to the build script, and the review evidence had no way to
catch it.

## Flaw 2 (confirmed) — Panda 8's 25:1 payout amount is never asserted

`engine.test.ts:146-156`, the `playerWin` settlement case:

```ts
const playerWin = settleHand(...);
expect(playerWin.outcome).toBe("player");
expect(playerWin.isPanda).toBe(true);
expect(playerWin.mainPayouts.player).toBe(1);
```

This is the only test that produces `isPanda: true`, and it checks the flag
and the main-bet payout but never `playerWin.sidePayouts.panda`. Compare to
the Dragon case three lines later (`engine.test.ts:169`), which does assert
`bankerDragon.sidePayouts.dragon).toBe(40)`. The 25:1 constant
(`rules.ts:86`, `pandaSidePayout = isPanda ? 25 : 0`) could be changed to any
value — 0, 20, 100 — and the suite would still report 9/9 green. This is a
hard-constraint number (PRODUCT.md: "Panda 8 side bet: pays 25:1") with no
regression protection.

## Flaw 3 (real gap, lower severity) — plain (non-side-bet) win/loss payouts are never independently exercised

The `settlement` describe block (`engine.test.ts:139-182`) covers three
cases: player-win-with-panda, banker-win-with-dragon, and tie. There is no
test for an ordinary banker win (no Dragon) or an ordinary player loss, so:

- `mainPayouts.banker === 1` (plain banker win, `rules.ts:79-80`) is never
  asserted by itself — every banker-win case in the suite has `isDragon:
  true`, so the `1` branch of that ternary (as opposed to the `0`
  Dragon-push branch) is exercised only incidentally via `dealRound` in the
  replay/lifecycle tests, never directly checked against the domain-fact
  no-commission 1:1 rule.
- `mainPayouts.player === -1` (a losing player bet) is never asserted
  anywhere in the file — the only losing-bet numeric checked is
  `mainPayouts.banker === 0` on tie push.

Not "a test that cannot fail" in the strict sense (the existing assertions
do constrain real behavior), but these are two of `settleHand`'s eight
outcome/flag branches (`rules.ts:76-84`) that ship with zero direct
coverage, on code explicitly called out by the hard constraint as needing to
be "exact and deterministic... no simplified or approximate rules."

## Not flaws — verified correct, mentioned for the record

- Burn-consumption arithmetic in the cut-card retirement test
  (`engine.test.ts:197-234`) is easy to mis-add by hand (I did, initially) —
  it only checks out once you count the 2 cards `openShoeWithBurn` consumes
  before round 1. Traced fully; the test and the code agree.
- `createShoe`'s `initialCards.map((card, index) => ({ ...card, id: index
  }))` (`shoe.ts:48`) silently reassigns sequential ids to any custom deck
  passed in, discarding original ids. Every current test happens to pass
  already-sequential ids, so it's invisible today — flagging as a latent
  footgun for future fixtures, not a present bug.

## Bottom line

Core game math (tableau, settlement, burn, determinism) is correct and
matches PRODUCT.md's Domain facts precisely — I could not construct a
counterexample. Real issues found are: one confirmed dead-code compile error
invisible to the build/test pipeline as configured (Flaw 1), and two genuine
test-coverage gaps on hard-constraint-relevant payout numbers (Flaws 2-3).
Recommend: import `Rank` or delete the three unused `shoe.ts` exports, add
`sidePayouts.panda === 25` to the existing panda test, add one plain
banker-win and one plain player-loss case to the settlement suite, and
consider adding `tsc --noEmit` to the verify-by-driving step so this class
of bug can't recur silently.
