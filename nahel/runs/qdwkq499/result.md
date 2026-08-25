---
run: qdwkq499
item: 9x1w62ms
status: success
summary: Fixed deal order to P,B,P,B in the engine and switched tie/side-settlement payouts to signed-net conventions.
---

Completed the requested task and wrote the result document to this run directory.

What I changed:

- In [`src/engine/engine.ts`](src/engine/engine.ts), I fixed the initial deal order to `player, banker, player, banker` by drawing in that sequence from the shoe.
- In the same function, I updated `seenThisRound` to capture cards in the same exposure order as dealt: `[p1, b1, p2, b2]`.
- In [`src/engine/rules.ts`](src/engine/rules.ts), I changed settlement payout semantics:
  - `mainPayouts.tie` now returns `8` on tie and `-1` otherwise.
  - `sidePayouts.dragon` now returns `40` on Dragon 7 and `-1` otherwise.
  - `sidePayouts.panda` now returns `25` on Panda 8 and `-1` otherwise.
- I did **not** modify `src/engine/qa-probe.test.ts`, per instruction.

Notes:

- No other files were changed.
- I did not execute the test suite locally.
