---
run: 7xn42bys
item: fc5v6szj
role: dev
created: 2026-08-25T03:27:59Z
---
# Task — fix accepted panel finding, engine-counts (fc5v6szj), build-review/fix, drive f3v0f30d

ACCEPTED (terra, run d3vw3vz4): the exposed burn card must update count
state AT SHOE OPEN, not first inside dealRound — the player decides the
FIRST side bet before any hand is dealt, and the pre-first-hand count/true/
signal currently omit that seen card (engine.ts:97 prepends it to the
first round's count input instead).

Fix: count the exposed burn when the engine opens the shoe (createEngine /
new-shoe path): it lands in count state immediately; the first round's
trace still SHOWS it (its display position at the front of the opening
trace may stay), but running/true/signals must be correct before round 1.
Red-first: a test asserting count state and both bet signals directly
after shoe open (before any dealRound) reflect the exposed card — the test
terra proved missing. Keep all 25 existing tests green without weakening;
adjust the seam test only insofar as its permitted-defect assertion shape
changes.

bun not on PATH; host verifies. No git commits. Result to your run
result.md.
