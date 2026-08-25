---
run: 11baxjbs
item: 7rfz93dh
status: success
summary: FAST now drains and bypasses timeline waits, with normal timing budget coverage and animation fallbacks.
---

Implemented the FAST playback hardening and timing regression coverage.

- `createTimelineWaiter` now treats FAST as a terminal playback mode: it resolves the active timeout and every later wait resolves immediately until the next round resets it.
- The round timeline can also release a pending animation-frame gate, which has a 50ms fallback for backgrounded/suppressed frames. Timeline cleanup is protected with `finally`.
- FAST carries through the outcome-banner stage and payout wait, so a click during card dealing cannot leave a later awaited round stage at normal speed.
- Added a fallback to the shoe's `animationend` wait using its computed (and speed-scaled) animation duration.
- Restored a single explicit JS timing schedule for cards: 5,592ms for a six-card round (including the five 140ms staggers), before the 320ms banner and 600ms payout stages. The previous duplicate flip wait has been removed from `card-el`/timeline flow.
- Added timing tests for the exact normal six-card schedule and a mid-schedule FAST invocation that must fully resolve.

Verification:

- `/Users/jimcarter/.bun/bin/bun test` — 42 pass, 0 fail.
- `/Users/jimcarter/.bun/bin/bunx tsc --noEmit` — pass.
- `git diff --check` — pass.

No commit created. `nahel` itself was unavailable on PATH, so no CLI journal entry could be written; this required result document was written directly.
