---
run: e5838en6
item: sk6gevft
role: dev
created: 2026-08-25T05:12:39Z
---
# Task — close sonnet's two findings, pacing bug (sk6gevft), build-review/fix, drive 59ny77y9

Report: nahel/runs/s8kjhjxp/result.md — read it; it localizes both.

1. Third-card flip/reveal fires with zero wait: restore the third-card
   emphasis timing (spec: 520ms with its stagger) without reopening the
   overall budget — the overlap optimization must not zero-out the
   third-card's own reveal wait.
2. The schedule oracle must exercise the code path that had the bug:
   assert the third-card wait is nonzero and equals the spec value inside
   the overlapped schedule (red-first — make it fail against the current
   zero-wait behavior, then fix).

58 existing tests stay green; tsc clean. bun not on PATH; host verifies +
re-drives. No git commits. Result doc to your run result.md.
