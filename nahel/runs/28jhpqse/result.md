---
run: 28jhpqse
item: 9x1w62ms
status: success
summary: Fixed the seeded deal-order fixture to mirror Player-Banker-Player-Banker draw order and conditional third-card draws.
---

## Outcome

- Root cause identified from the failure: the fixture expected `expected.player` to be `[card0, card1]` and `expected.banker` to be `[card2, card3]`, which assumes `P,P,B,B`.
- `dealRound` is already dealing in canonical order (`P,B,P,B`) and already implements third-card sequencing (`player third = next card when player draws`, `banker third = next card after any player third draw), so the engine side is correct.

## What I changed

- Updated `src/engine/engine.test.ts` in `deal order` test:
  - Build expected hands from a control shoe in draw order `P,B,P,B` instead of drawing all player cards first.
  - Compute initial totals, then apply `shouldPlayerDraw` / `shouldBankerDraw` to add optional third cards using the seeded control shoe.
  - Build `expected.seenThisRound` incrementally in the same card-exposure order the engine uses and assert against it.
  - Kept assertion shape as ID sequences from deterministic control draw, without weakening expected structure.

## Verification status

- I did not run `bun` locally because `bun` is not available in this environment.
- Host-run tests were already reported by you; this fix targets that single seeded deal-order expectation failure.
