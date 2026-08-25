---
run: efstaa5f
item: pge65a4e
role: qa
created: 2026-08-25T05:17:06Z
---
# Task — full-game-qa sweep (qa item pge65a4e)

The epic is feature-complete: engine, counts, table view, count panel,
pacing fix — 59 tests green. Your item is the PRD's acceptance sweep
(docs/prds/ez-baccarat-game.md, every Acceptance bullet) plus exploratory
hostility. Follow nahel/workflows/qa-lane.md's spirit: exploratory
judgment once, then ratchet everything reproducible into deterministic
tests.

1. Read the PRD acceptance bullets and enumerate them with their current
   coverage (name the test file:test that covers each; NONE where absent).
2. Write src/qa/sweep.test.ts filling every gap that is headlessly
   testable: full-shoe simulation to retirement across 3 seeds (invariants:
   totals always tableau-legal, counts never NaN, bankroll conservation
   across a full shoe of scripted bets, panda round settlement, natural
   short-circuits), plus anything your exploration finds.
3. Browser checklist for the host: the passes that need eyes, exact steps,
   expected observations — INCLUDING a panda-round seed if you can compute
   one, casino-mode self-test flow, keyboard-only play, and localStorage
   persistence across reload.
4. File NOTHING yourself: report defects with repro steps in your result
   doc; the host turns accepted ones into bug items.

End result.md with verdict: pass|fail per acceptance bullet + overall.
bun not on PATH; host runs your tests.
