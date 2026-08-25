---
run: st4cvpza
item: 4tf7cfvg
role: dev
created: 2026-08-25T04:52:50Z
---
# Task — fix accepted panel findings, count-panel-trainer (4tf7cfvg), build-review/fix, drive ffnwn3fm

Reports: nahel/runs/2wznz6n8/result.md + nahel/runs/tgkdv3r5/result.md
(read both; they localize file:line). All accepted:

1. HIGH (both reviewers): the displayed TRUE count must NEVER contradict
   the signal. Rule to implement: signals stay on exact math; the DISPLAY
   truncates toward zero at 1 decimal (3.96 → "3.9", -3.96 → "-3.9") so a
   shown value never reaches a threshold the exact value has not reached;
   the to-go caption computes from exact math with proper rounding UP of
   the remaining distance (needs 0.04 more → "0.1 to go", never "0.0 to
   go" while NO BET). Add boundary tests: exact 3.96/3.99…/4.0/4.04 and
   the panda equivalents — display, signal, and caption all consistent.
2. MEDIUM: to-go caption float artifacts — compute in a way that cannot
   render "-0.0" or 10.899999 (round remaining distance up to 1 decimal).
3. Panel tests: create the missing count-panel test module covering signal
   state mapping, display truncation, caption arithmetic, multi-round
   chain reset, burn-row round-1-only, casino re-show state.

Suite green + tsc clean. bun not on PATH; host verifies + re-drives. No
git commits. Result to your run result.md.
