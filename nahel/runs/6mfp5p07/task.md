---
run: 6mfp5p07
item: h7g4w2rg
role: dev
created: 2026-08-25T05:25:01Z
---
# Task — bug over-wager-accepted (item h7g4w2rg), build-review/implement, drive 7740hbkk

BUG (major, reproduced live): placing chips never checks the bankroll —
$5,000 was accepted against a $4,350 bankroll; settlement clamps at zero,
masking it. Sol's analysis: nahel/runs/efstaa5f/result.md (bankroll
section).

RED FIRST: an integration test — scripted placements exceeding bankroll
must be REFUSED (state unchanged), boundary exactly-equal accepted, and a
multi-spot case (total committed across spots counts against the limit).
Then fix: placement refuses when chip value > bankroll - total committed;
give visible feedback (status line message and/or spot deny animation per
existing patterns); keyboard path refuses identically. Settlement's
clamp-at-zero becomes an invariant assertion (bankroll can never go
negative once placement is guarded).

All 64 tests stay green; tsc clean. bun not on PATH; host verifies +
re-drives. No git commits. Result to your run result.md.
