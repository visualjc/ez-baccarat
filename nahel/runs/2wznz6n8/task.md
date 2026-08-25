---
run: 2wznz6n8
item: 4tf7cfvg
role: reviewer-terra
created: 2026-08-25T04:47:00Z
---
# Task — adversarial panel on count-panel-trainer (4tf7cfvg), build-review/panel, drive ffnwn3fm

Change: git show HEAD --stat; read the count-panel modules in src/ui/ (and
their tests), docs/design/4tf7cfvg.md (normative), and the transcript:
nahel/runs/ffnwn3fm/artifacts/build-review/implement/dev/panel-impl-transcript.txt
(host hand-checked round-1 arithmetic — it is exact; attack what the hand
check did NOT cover).

Attack: does ANY panel value come from UI-side re-derivation instead of
the engine trace? rounding rules (true count display at 1 decimal — floor/
round/trunc consistent with signals? a displayed 3.9-as-4.0 lying about a
signal?), the to-go arithmetic, trace behavior across MULTIPLE rounds
(does the chain reset per round correctly? burn row only round 1?), casino
mode (no count leakage while hidden? state correct when re-shown after
several hidden rounds?), shoe retirement/new-shoe reset, the tests (a test
that cannot fail is a flaw). Name each flaw file:line. None = say so.
Findings to your run result.md. Do not modify code.
