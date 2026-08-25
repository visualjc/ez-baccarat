---
run: 9mva0z1m
item: 9x1w62ms
role: dev
created: 2026-08-25T03:04:15Z
---
# Task — third attempt, exact defect location. engine-core (9x1w62ms), drive ekq4swkd

The failure persists because the TEST'S CONTROL SHOE builds hands in the
old order. In engine.test.ts (the "deal order" test), the control does:

    const expected = {
      player: [drawCard(controlShoe.shoe), drawCard(controlShoe.shoe)],
      banker: [drawCard(controlShoe.shoe), drawCard(controlShoe.shoe)],
      ...

That assigns shoe cards 0,1 to player and 2,3 to banker (P,P,B,B) while the
ENGINE now correctly deals P,B,P,B (0→player, 1→banker, 2→player, 3→banker).
Fix the CONTROL to interleave:

    const p1 = drawCard(controlShoe.shoe);
    const b1 = drawCard(controlShoe.shoe);
    const p2 = drawCard(controlShoe.shoe);
    const b2 = drawCard(controlShoe.shoe);
    expected.player = [p1, p2]; expected.banker = [b1, b2];

seenThisRound stays [p1, b1, p2, b2] in that order. Third-card logic below
it is already sequential and stays. Make ONLY this control-order change —
do not touch the engine, do not loosen any assertion. Do not commit to git.
Append to your result.md what changed.
