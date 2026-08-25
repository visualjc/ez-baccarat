---
run: 99pst2vy
item: 9x1w62ms
status: failure
summary: QA found canonical deal-order and signed-net settlement regressions despite burn and cut-card controls passing.
---

## Work performed

Added the only permitted product-tree file, `src/engine/qa-probe.test.ts`. It contains hostile black-box/API probes for:

- player natural 8 versus banker 7 with no third-card draws;
- two-card Banker 7, three-card Dragon 7, three-card Panda 8, and tie settlement;
- exposed Ace and ten-value burn cards, exact face-down burn counts, and decks-remaining arithmetic;
- exact, independently replayed tableau decisions for seeds `1`, `42`, and `qa-seed`;
- cut-card crossing, continued availability during the crossing round, and retirement only on `finalizeRound`.

No existing source or test file was modified, and nothing was committed.

## Evidence

Command:

```text
/Users/jimcarter/.bun/bin/bun test src/engine/qa-probe.test.ts
```

Result:

```text
4 pass
7 fail
70 expect() calls
Ran 11 tests across 1 file.
```

The pre-existing suite alone remains green (`9 pass`, `149 expect() calls`), demonstrating that its coverage does not catch the regressions below. The final combined suite result is `13 pass`, `7 fail`, and `219 expect() calls` across 20 tests.

## Defects

1. **Initial deal order is still `P,P,B,B`, not canonical `P,B,P,B`.**
   - `src/engine/engine.ts` calls `drawCard` twice for Player and then twice for Banker.
   - Repro: the controlled natural case should deal Player `[8,T]` and Banker `[7,T]`; the engine returns Player `[8,7,K]` and consequently draws when the real Player hand is a natural 8.
   - Independent seeded replay also disagrees with `dealRound` for seeds `1` and `qa-seed`. Seed `42` passes coincidentally.

2. **Settlement is not signed-net for all five wagers.**
   - `src/engine/rules.ts` returns `0` for every losing Tie, Dragon, and Panda wager; each must return `-1` under the stated signed-net contract.
   - Two-card Banker 7 classification itself is correct (`isDragon === false`) and Banker pays `+1`, but losing Tie/side wagers are wrong.
   - Three-card Banker 7 classification, Banker push, and Dragon `+40` are correct, but losing Tie/Panda wagers are wrong.
   - Three-card Player 8 classification, Player `+1`, and Panda `+25` are correct, but losing Tie/Dragon wagers are wrong.
   - Tie correctly pays `+8` and pushes both mains, but both side bets incorrectly return `0` instead of `-1`.

## Passing controls

- Ace exposure consumes one exposed card plus one unseen burn; 414 cards remain (`414 / 52` decks).
- Ten exposure consumes one exposed card plus ten unseen burns; 405 cards remain (`405 / 52` decks).
- The exposed burn card is separate from the face-down `unseenBurnCards` collection.
- All hard-coded seed expectations and independent physical-shoe tableau replays pass before comparison with `dealRound`.
- Crossing the cut index sets `retireAfterCurrentRound` without immediately retiring the shoe; `finalizeRound` performs retirement and later draws are rejected.

verdict: fail
evidence: hostile probe is 4 pass / 7 fail; canonical deal order and signed-net loss semantics do not match the task contract.
