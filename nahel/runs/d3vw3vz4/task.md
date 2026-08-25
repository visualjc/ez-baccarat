---
run: d3vw3vz4
item: fc5v6szj
role: reviewer-terra
created: 2026-08-25T03:23:00Z
---
# Task — adversarial panel on engine-counts (item fc5v6szj), build-review/panel, drive f3v0f30d

Change: git show HEAD --stat; read src/engine/counts.ts,
src/engine/counts.test.ts, and the engine seam diff in src/engine/engine.ts
+ engine.test.ts ("counting seam" tests). Transcript artifact:
nahel/runs/f3v0f30d/artifacts/build-review/implement/dev/counts-transcript.txt

PRODUCT.md "Domain facts" is normative. Attack:
- tag tables per rank, BOTH systems (Dragon: 4-7→-1, 8/9→+2, else 0;
  Panda: T-K/A/2→+1, 3/4/5/8→-2, 6/7→-1, 9→+4)
- true count = running ÷ (unseen/52); unseen = 416 − seen (face-down burns
  UNSEEN, exposed burn SEEN and counted)
- thresholds ≥+4 / ≥+11 on the TRUE count, edge behavior at the boundary
- the round trace's before/after arithmetic (hand-check one)
- the tests (a test that cannot fail is a flaw)
Name each flaw file:line. None found = say so plainly.
Findings to your run result.md. Do not modify code.
