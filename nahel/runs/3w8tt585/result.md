---
run: 3w8tt585
item: 7rfz93dh
status: success
summary: Restored card reveals and made FAST complete the round timeline in under 200ms simulated time.
---

Implemented both regressions from the previous animation refactor.

- Removed the competing `card-flip` keyframe so the existing `.is-flipped` 3D transform/transition again swaps from the red back to the card face at the flip midpoint.
- Changed FAST to a 2.5% speed scale for both the table CSS custom properties and the timeline scheduler.
- Extracted the timeline waiter so FAST resolves its current pending delay and scales every future wait consistently.
- Added a virtual-clock regression test covering a complete six-card timeline schedule; after FAST it completes in under 200ms of simulated time.

Verification:

- `/Users/jimcarter/.bun/bin/bun test` — 41 passed, 0 failed.
- `/Users/jimcarter/.bun/bin/bun x tsc --noEmit` — passed.
- `git diff --check` — passed (the environment printed unrelated temporary-cache warnings).

`nahel` was unavailable on PATH in this worker shell, so I could not add a CLI journal event. No git commit was made.
