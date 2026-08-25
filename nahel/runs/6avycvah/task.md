---
run: 6avycvah
item: fc5v6szj
role: dev
created: 2026-08-25T03:18:30Z
---
# Task — one failing test, engine-counts (fc5v6szj), drive f3v0f30d

24/25 pass. Your new seam test fails:

    engine.test.ts:252 — counting seam > includes opening burn card at the
    front of first-round count input
    error: "shoe depleted" thrown from dealRound (engine.ts:90 drawCard)

The test's fixture shoe runs out of cards mid-round (likely too few cards
after the burn consumes 1 + face-value more, or cutOffset math). Inspect
the fixture: it must supply enough cards for burn + a full worst-case round
(6 cards) — pad the initialCards. Fix the FIXTURE if it is starved, or the
seam if it double-consumes; never weaken the assertion. bun not on PATH;
host verifies. No git. Append findings to your run result.md.
