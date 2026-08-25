---
run: 2wznz6n8
item: 4tf7cfvg
status: failure
summary: Found a threshold-rounding contradiction and missing required panel lifecycle tests.
---

## Findings

1. **High — a displayed true count can meet the displayed threshold while the panel says NO BET.**
   [src/ui/count-format.ts:6](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-format.ts:6) rounds the engine value to nearest one decimal, while [src/ui/count-panel.ts:30](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-panel.ts:30) uses the unrounded engine signal and [src/ui/count-panel.ts:32](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-panel.ts:32) rounds the amount still needed.  For example, a valid Dragon state with running 21 and 276 unseen cards has true count `21 / (276 / 52) = 3.9565…`: the panel displays `TRUE 4.0`, `needs true ≥ +4 · 0.0 to go`, and `NO BET`.  The same contradiction is exposed to screen readers through [src/ui/count-panel.ts:35](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-panel.ts:35).  This makes the displayed threshold and the authoritative decision disagree. Display a non-ambiguous value (for example, truncate below a threshold or show sufficient precision) and calculate the caption in the same display convention; add boundary cases immediately below each threshold.

2. **Medium — the required headless panel tests are absent, leaving the most failure-prone state transitions unguarded.**
   The only new formatting test, [src/ui/count-format.test.ts:3](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-format.test.ts:3), covers negative zero, deck formatting, and a count word; it cannot detect the threshold contradiction above.  The only narration fixture, [src/ui/count-narration.test.ts:4](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-narration.test.ts:4), exercises one under-threshold path.  There is no `src/ui/count-panel.test.ts`, despite the normative design requiring tests for `shoe:opened` burn seeding, round-one non-double-counting, casino `inert` plus hidden-round updates/reveal, reconciliation mismatch replacement, and reset after shoe retirement/new shoe.  These behaviors live in [src/ui/count-panel.ts:76](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-panel.ts:76)-[src/ui/count-panel.ts:85](/Users/jimcarter/projects/personal_projects/ez-baccarat/src/ui/count-panel.ts:85), but no current test invokes them. Add DOM/bus tests covering at least two settled rounds, a hidden-mode interval, retirement, and a newly opened shoe.

## Checked and not found defective

- The panel consumes authoritative `result.counts.trace` on settlement; its provisional tags use engine tag functions as expressly permitted by the design and are reconciled afterward.
- The engine advances from the existing count state with only current-round seen cards, so the exposed burn is not re-applied in round one.
- Casino mode continues processing settlement events while hidden, and `shoe:opened` clears the provisional list and re-renders from the new engine opening trace.

## Verification

`/Users/jimcarter/.bun/bin/bun test` passed: 50 tests, 0 failures. The local `bun` command is not on `PATH`; the project-local Bun binary was used.
