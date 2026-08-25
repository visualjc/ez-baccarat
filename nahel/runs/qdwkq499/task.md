---
run: qdwkq499
item: 9x1w62ms
role: dev
created: 2026-08-25T03:14:01Z
---
# Task — QA exposed regressions; fix the ENGINE. engine-core (9x1w62ms), drive ekq4swkd

QA (gpt-5.6-sol, run 99pst2vy) wrote independent probes
(src/engine/qa-probe.test.ts) — 7 fail. Root causes, confirmed by the host
reading the code:

1. **engine.ts dealRound STILL deals P,P,B,B** (lines ~64-67: two player
   pushes then two banker pushes). Your earlier "deal order fix" runs
   changed only the TESTS to mirror the engine — circular. Fix THE ENGINE:
   draw interleaved player, banker, player, banker. Then fix the engine
   test's control shoe to draw interleaved too, and make its seenThisRound
   assertion order [p1, b1, p2, b2].
2. **Tie bet must LOSE (-1) on a non-tie round.** rules.ts settleHand
   returns mainPayouts.tie = 0 when banker or player wins; the signed-net
   convention says every wager loses its stake when it does not hit:
   tie = -1 on any non-tie outcome, +8 on tie.

Do NOT modify src/engine/qa-probe.test.ts — it is the independent oracle;
all 11 of its tests must pass as written. Never weaken any other
assertion's semantics; exact-id fixtures may be recomputed only because the
ENGINE order changes. bun is not on your PATH; the host verifies. Do not
commit to git. Result to your run result.md.
