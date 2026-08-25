---
run: chgzg5gb
item: sk6gevft
role: dev
created: 2026-08-25T05:00:19Z
---
# Task — bug round-pacing-over-spec (item sk6gevft), build-review/implement, drive <R5>

BUG (from sol's audit, nahel/runs/y7ww8yvk/result.md — read its pacing
section): a normal 6-card round takes ~22s wall-clock and FAST ~5-7s,
vs the design contract's ~3.4s card schedule (docs/design/7rfz93dh.md §3
durations: deal 380ms, flip 300ms, third 520ms, staggers 140ms) plus
banner/settle holds. Sol measured the headless schedule itself at 5592ms
(already 64% over) and could not account for the rest inside
round-timeline — the extra lives in the game flow around it (status
narration waits, banner holds, celebration chains, post-settle locks).

REPRO FIRST (bug rule): write a failing test that measures the full
DEAL→controls-unlocked flow in simulated time (stub timers) and asserts a
budget: normal round ≤ spec-sum + banner/settle allowance (define the
allowance from the design doc's banner/sweep/pay durations — compute it in
the test from the CSS tokens, target ≈ 6s for a 6-card round), FAST ≤
800ms simulated. Then fix until green: trim the schedule to the spec
durations, collapse redundant waits, make narration non-blocking, keep the
dragon/panda celebrations at their spec durations (they may exceed the
budget only on dragon/panda rounds).

All 57 existing tests stay green; tsc clean. bun not on PATH; host
verifies + re-drives with wall-clock timing. No git commits. Result to
your run result.md.
