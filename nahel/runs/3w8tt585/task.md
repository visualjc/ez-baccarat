---
run: 3w8tt585
item: 7rfz93dh
role: dev
created: 2026-08-25T04:09:41Z
---
# Task — two live regressions from your fix, app-shell-table (7rfz93dh), drive xe6r970y

Host re-drove in a real browser after your fix run tt0pbyw5. The layout
clip is FIXED (all five spots visible at 1280x900) and settlement stays
correct (+$25 banker win, deterministic under seed 42). TWO regressions:

1. **Card faces never reveal.** Every card now stays on its red back for
   the whole round (pre-fix, the flip showed faces — 7♥ etc.). Totals
   update, but the table shows only card backs through settlement. Your
   named card-flip keyframes likely replaced the class/JS handoff that
   swapped the face — find where .flipped (or equivalent) used to land and
   make the reveal actually show the face at flip midpoint again.
2. **FAST is still not a fast-forward.** Synthetic FAST clicks during the
   round leave ~4s between reveals; a full round still takes 20s+. Trace
   the whole chain: the click handler, speedScale application to PENDING
   and FUTURE waits, and the CSS custom-prop scaling — then add a headless
   regression test that a timeline with speed-fast completes its schedule
   in <200ms of simulated time.

Verify with the existing suite (40 tests) staying green and tsc clean.
bun not on PATH; host verifies + re-drives. No git commits. Result to your
run result.md.
