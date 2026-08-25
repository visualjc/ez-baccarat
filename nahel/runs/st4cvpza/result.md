---
run: st4cvpza
item: 4tf7cfvg
status: success
summary: Fixed conservative true-count display and threshold captions, with complete count-panel regression coverage.
---

Implemented all accepted panel-review fixes.

- True-count display now truncates toward zero at one decimal, while the engine's exact count continues to control the bet signal. This keeps the numeral, narration, and accessible label from appearing to cross a threshold early.
- Threshold captions now round the exact remaining/over distance upward to one decimal with a floating-point tolerance, avoiding both `0.0 to go` while still under the line and artifacts such as `10.899999…` or `-0.0`.
- Added `src/ui/count-panel.test.ts`, using a small headless DOM harness to cover exact Dragon/Panda boundary states (3.96, 3.99, 4.0, 4.04 and 10.96, 10.99, 11.0, 11.04), signal/pill mapping, captions, multi-round trace clearing with count chaining, fresh-shoe reset and burn-row lifecycle, and casino-mode hidden updates/reveal.
- Expanded `count-format` tests for display truncation and conservative distance formatting.

Verification completed successfully:

- `/Users/jimcarter/.bun/bin/bun test` — 55 passing tests, 0 failures.
- `/Users/jimcarter/.bun/bin/bunx tsc --noEmit` — clean.
- `git diff --check` — clean (Git emitted unrelated sandbox warnings while attempting to create `/tmp/xcrun_db-*` cache files).

No Git commit was created. The `nahel` CLI was unavailable on this host (`command not found`), so I could not write a Nahel journal event; the required result is recorded here.
