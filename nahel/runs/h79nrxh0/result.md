---
run: h79nrxh0
item: 4tf7cfvg
status: success
summary: Implemented the engine-backed Count Trainer panel with burn/round explanations, rules, modes, motion, and tests.
---

Implemented the F3 Count Trainer design.

- Extended the engine count trace with cumulative per-card running totals, retained the opening burn trace, and exposed authoritative counts on each `RoundResult`.
- Wired opening-shoe counts through the UI bus and replaced the reserved panel placeholder with the Count Trainer.
- Added formatted live Dragon 7 and Panda 8 count blocks, threshold signals/meters, authoritative per-card trace rows, burn visibility, delta narration, count-rule reference, trainer/casino behavior, and panel motion.
- Added pure formatter/narration tests and coverage that round one does not double-count the exposed burn card.

Verification completed successfully:

- `./node_modules/.bin/tsc --noEmit`
- `/Users/jimcarter/.bun/bin/bun test` — 50 passing tests
- `./node_modules/.bin/vite build`

The `nahel` CLI was not available on PATH, so no CLI journal/status/validate commands could be run. No git commit was created.
