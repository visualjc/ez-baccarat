---
run: 6xzn2cyj
item: 4tf7cfvg
status: success
summary: Added a mechanical adversarial panel probe covering a seeded burn, three-round literal count continuity, narration, formatting, and signal boundaries.
---

Created `src/ui/panel-qa-probe.test.ts` without modifying existing files.

The probe uses seed `panel-qa-mechanical` and independently records PRODUCT.md's tags as literals. It verifies:

- exposed `T` burn card is counted as Dragon `0` / Panda `+1`, while all ten face-down burns remain uncounted;
- three engine-driven rounds and every per-card Dragon/Panda tag and running-count transition;
- uninterrupted `trace.before === prior trace.after` continuity from opening burn through round three;
- exact seen-card/decks-remaining state after each round;
- panel formatting and delta-sentence narration against literal expected strings, including a mixed positive/negative/neutral round;
- conservative boundary displays and signal states at Dragon `3.96`/`4.0` and Panda `10.96`/`11.0`.

Verification: `/Users/jimcarter/.bun/bin/bun test src/ui/panel-qa-probe.test.ts` completed with 2 passing tests, 0 failures, and 20 assertions.

verdict: pass — evidence: `src/ui/panel-qa-probe.test.ts` contains literal independent oracles for the opening burn plus three seeded rounds, chain continuity assertions, mixed-round narration, and both exact signal-display boundaries; its focused Bun run passed 2/2 tests (20 assertions).
