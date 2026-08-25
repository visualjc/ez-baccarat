---
run: 6xzn2cyj
item: 4tf7cfvg
role: qa
created: 2026-08-25T04:57:32Z
---
# Task — QA count-panel-trainer (4tf7cfvg), build-review/qa, drive ffnwn3fm

PRD F3 acceptance: "QA hand-verifies the panel against the tag tables for
at least three rounds including a burn card." The host already hand-checked
round 1 + the opening burn in a live browser (implement transcript). Your
job: make that verification MECHANICAL and adversarial.

Write src/ui/panel-qa-probe.test.ts (do not modify existing files): drive
the ENGINE for three-plus seeded rounds (seed of your choice), feed its
traces through the panel's pure formatting/state functions, and assert
against an INDEPENDENTLY hand-computed table you derive from PRODUCT.md's
tag tables (write the expected numbers as literals in the test — do not
call the engine's tag functions to build expectations). Cover: a burn
card, both signals' boundary displays (inject synthetic CountStates at
3.96/4.0/10.96/11.0), the delta-sentence builder on a mixed round, chain
continuity across the three rounds.

End result.md with verdict: pass|fail + evidence. bun not on PATH; host
runs probes.
