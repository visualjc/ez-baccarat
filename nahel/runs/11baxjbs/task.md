---
run: 11baxjbs
item: 7rfz93dh
role: dev
created: 2026-08-25T04:16:11Z
---
# Task — FAST hangs the round timeline. app-shell-table (7rfz93dh), drive xe6r970y

Host browser forensics (live, minutes after clicking FAST mid-round):
- .table-view classes: "felt speed-fast" — fast engaged
- computed --speed-scale on documentElement: "1" (the .speed-fast override
  is scoped to the table element, but round-timeline.ts:128-130 reads
  documentElement — mismatch)
- the round NEVER settles: button stays FAST, no Net status, totals frozen.
  This is a HANG, not slowness: something in the awaited chain
  (animateCard's waits, waiter.reset() interplay at round-timeline.ts:
  ~100-115 + table-view.ts:164-276, or an animationend listener that never
  fires at 1ms durations) never resolves after fastForward().
- WITHOUT touching FAST, a round settles in ~20-30s — also far over the
  spec durations (380/300/520ms + 140ms staggers ≈ 5-6s for 6 cards), so
  a second multiplier or serialized narration wait exists somewhere.

Fix both:
1. The hang: make fastForward() unable to strand a pending wait — resolve
   the active timeout AND make every future wait resolve immediately
   (timer scale from ONE source of truth the JS reads, e.g. the waiter's
   own speedScale, never computed CSS); guard animationend-style waits
   with a scaled timeout fallback.
2. The 4-5x real-time factor on normal rounds: instrument where the extra
   delay comes from (narration waits? banner? outcome hold?) and bring a
   normal 6-card round to roughly the sum of spec durations.
Add a headless regression: a full timeline run with fastForward() called
mid-schedule RESOLVES (completes) — assert completion, not just timing.

Suite green + tsc clean. bun not on PATH; host verifies + re-drives. No
git commits. Result to your run result.md.
