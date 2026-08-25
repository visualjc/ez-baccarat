---
run: y7ww8yvk
item: 7rfz93dh
role: qa
created: 2026-08-25T04:20:56Z
---
# Task — QA app-shell-table (7rfz93dh), build-review/qa, drive xe6r970y

Change summary + fix report in the drive journal. The app is a browser UI;
you cannot drive a browser — QA the HEADLESSLY testable surface and audit
the code paths, and the host performs the browser passes you specify.

1. Write src/ui/qa-probe.test.ts (do not modify existing files):
   - bankroll application across a scripted 5-round sequence with every
     wager type incl. dragon-push and side-bet losses (engine-fed, not
     hand-authored settlements)
   - localStorage guard behavior: a throwing storage stub must not break
     mount or bet flow (fallback path asserted)
   - keyboard reducer: every key in docs/design/7rfz93dh.md's map reaches
     its action; unknown keys are ignored
   - timeline completion: fastForward mid-schedule resolves; normal
     schedule total equals the spec-sum of its durations (this documents
     the 22s pacing gap if the schedule itself is over-budget — assert the
     SCHEDULE, and if it is on-budget, say the gap is outside the timeline)
2. Audit (report, no code): where does the extra ~14s/round come from?
   Name file:line of every wait/hold in a normal round outside the card
   schedule (banner holds, celebrations, burn, status narration).
3. Specify a 5-step browser checklist for the host (exact clicks and
   expected observations) covering: tie round, dragon round if reachable
   by any seed you can compute from the engine, mode toggle, rebet, shoe
   exhaustion behavior.

End result.md with verdict: pass|fail (+ the pacing-gap audit). bun not on
PATH; host runs your probes.
