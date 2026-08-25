---
run: h79nrxh0
item: 4tf7cfvg
role: dev
created: 2026-08-25T04:39:25Z
---
# Task — count-panel-trainer (item 4tf7cfvg), build-review/implement, drive run ffnwn3fm

Implement docs/design/4tf7cfvg.md — read it in FULL; literal values are
normative. PRD F3 is the scope; PRODUCT.md hard constraint 2 is the bar
(every round, the panel shows the per-card tags and why each count moved).

The dock + typed seam already exist (table-view reserved the region; check
src/ui/types.ts and the count-panel mount point). The engine's
src/engine/counts.ts CountState + round trace is the ONLY math source —
never re-derive tags or counts in the UI. Wire: shoe open (exposed burn
counted immediately — the panel must show it before round 1), per-round
trace render, trainer/casino visibility, collapsible reference card,
count-tick + signal-flip animations per the spec.

TDD for pure logic (trace formatting, delta sentence builder, signal state
mapping) in src/ui/count-panel.test.ts or similar; DOM stays thin. All 47
existing tests stay green; tsc --noEmit clean; vite build clean.

bun NOT on your PATH; the host verifies and drives in a browser. Do not
commit to git. Result to your run result.md.
