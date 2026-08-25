---
run: 39t9vekc
item: 9x1w62ms
role: dev
created: 2026-08-25T02:54:37Z
---
# Task — engine-core (item 9x1w62ms) CONTINUATION, build-review/implement, drive run ekq4swkd

Your prior result: nahel/runs/xs6yqksx/result.md (status partial — bun was
unavailable in your sandbox). The host ran the suite: 8/9 pass, ONE failure:

    src/engine/engine.test.ts:127 — tableau > is exhaustively coded for
    player-third-by-banker-total cells
    expect(shouldDraw).toBe(expected[bankerTotal].includes(playerThird))
    Expected: false, Received: true

Fix the tableau so the FULL suite passes. The standard banker drawing table
(player DID draw a third card; playerThird = that card's baccarat value):

- banker 0,1,2: always draw
- banker 3: draw unless playerThird == 8
- banker 4: draw when playerThird in 2..7
- banker 5: draw when playerThird in 4..7
- banker 6: draw when playerThird in 6..7
- banker 7: stand

When the Player STOOD (no third card), the Banker draws on 0–5, stands 6–7.
Naturals end the round first. Check whether the BUG is in rules.ts or in the
test's expected table — fix the wrong side, never weaken the right side.

`bun` is not on your sandbox PATH — do not attempt to run it; the host runs
the suite after you finish and will re-dispatch with output if anything
still fails. Do not commit to git. Write your result to your run dir's
result.md.
