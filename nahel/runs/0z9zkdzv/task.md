---
run: 0z9zkdzv
item: fc5v6szj
role: qa
created: 2026-08-25T03:45:51Z
---
# Task — QA engine-counts (fc5v6szj), build-review/qa, drive f3v0f30d

Change summary + fix report are in the drive journal; essentials: pure
counts module (both tag systems, true counts, signals, round trace), burn
counted at shoe open. bun NOT on your PATH — write probes as
src/engine/counts-qa-probe.test.ts (do not modify existing files); host
runs them.

Probe adversarially:
- hand-compute a full opening sequence: exposed burn 9 → Dragon +2 Panda
  +4 BEFORE round 1; then a round with known cards; assert running/true
  for both systems to exact fractions (unseen = 416 - seen)
- threshold boundaries: true exactly 4.0 (signal ON), 3.9999 (OFF); same
  for 11 on panda
- a card that is a face-down burn NEVER moves either running count
- trace before/after chain: each card's after == next card's before
End result.md with verdict: pass|fail + evidence.
