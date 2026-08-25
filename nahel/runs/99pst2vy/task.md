---
run: 99pst2vy
item: 9x1w62ms
role: qa
created: 2026-08-25T03:06:32Z
---
# Task — QA the engine-core change (item 9x1w62ms), build-review/qa, drive run ekq4swkd

Change summary and fix report are in the drive journal; the essentials:
pure engine under src/engine/ (shoe/burn/tableau/settlement, seeded RNG,
signed-net settlement for all five wagers), Vite scaffold, 10/10 bun tests.
This item is ENGINE-ONLY: the page is still a placeholder; UI comes later.

QA like a hostile user of the ENGINE API (bun is not on your PATH — write
your probes as a standalone test file src/engine/qa-probe.test.ts; the host
runs it and reports back if anything fails):

- adversarial probes: player natural 8 vs banker 7 (no draws), banker
  two-card 7 win must NOT be dragon, three-card banker 7 win must push
  banker main and pay Dragon 7 40:1, three-card player 8 win pays both main
  1:1 and Panda 25:1, tie pays 8:1 and pushes mains and LOSES side bets
- burn: exposed card seen, correct face-down burn count for A and for a
  ten-value first card, decks-remaining arithmetic
- hand-verify the tableau for three specific seeds by replaying the shoe
  in the probe and asserting the exact draw decisions
- cut-card: a shoe retires only after the crossing round settles

End your result.md with verdict: pass|fail and the evidence. Do not modify
existing files; only add the probe test. Do not commit to git.
