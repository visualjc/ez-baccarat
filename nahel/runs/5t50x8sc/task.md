---
run: 5t50x8sc
item: fc5v6szj
role: dev
created: 2026-08-25T03:16:59Z
---
# Task — engine-counts (item fc5v6szj), build-review/implement, drive run <R2>

## Scope (PRD F1.5–F1.6; PRODUCT.md "Domain facts" is normative)

New pure module src/engine/counts.ts (+ tests in src/engine/counts.test.ts):

- Tag tables, exact: Dragon 7 — 4,5,6,7 → −1; 8,9 → +2; A,2,3,T,J,Q,K → 0.
  Panda 8 — T,J,Q,K → +1; A → +1; 2 → +1; 3,4,5,8 → −2; 6,7 → −1; 9 → +4.
- CountState: per-system running count; decksRemaining = unseenCards / 52
  where unseenCards = 416 − seenCount − faceDownBurnCount... careful: face-
  down burns ARE unseen (they stay in the denominator's unseen pool — they
  are simply cards nobody saw; a card is EITHER seen (counted, out of
  unseen) OR unseen (in the denominator)). So unseen = 416 − seenCount.
  True count = running / (unseen / 52). Guard division as unseen→0.
- Bet signals: dragon at true ≥ +4, panda at true ≥ +11 (booleans + the
  thresholds exposed as constants).
- Round trace (F1.6): given the ordered seen cards of a round (burn card
  included on the shoe-opening round), emit per-card {rank, dragonTag,
  pandaTag} plus before/after {running, true, signal} for both systems —
  the exact data the count panel renders.
- Integrate: engine.ts exposes a per-round trace hook or the app can feed
  seenThisRound (and the exposed burn card) into counts.ts — keep counts
  PURE (no engine mutation); pick the seam that keeps engine.ts small.

TDD: tags per rank exhaustive (all 13 ranks, both systems), true-count
division incl. burn-card handling on the opening round, threshold edges
(3.99 vs 4.0), trace before/after arithmetic on a hand-computed round.
bun is NOT on your PATH — the host runs the suite and reports failures
back. Do not commit to git. Result to your run result.md.
