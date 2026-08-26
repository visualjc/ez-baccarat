---
id: 90pht2pr
name: decision-sx76p56m
created: 2026-08-26T22:29:39Z
tags:
  - decision
  - grilling
sources:
  - f5nh6t5b
  - ap2vgze8
  - nq5qjd3g
---
Out of this delta: the Panda 8 / Dragon 7 bursts keep firing from the .hand rect for now, and the mis-anchor is filed as its own bug item rather than folded in — hand-zone.ts, table-view.ts and celebration.ts are not touched here.

Decided by resolving grilling ticket sx76p56m, charting: Both hands are seated against the centre line the way a live EZ Baccarat layout is dealt: each seat's two-card group holds its INNER edge the same measured distance off the divider, each seat's total rides beside the divider instead of at the felt's outer edge, and each sideways third card lies OUTBOARD of its own group — the player's to its left, per the casino reference photo. A fresh agent can tell it has arrived by measuring: player inner edge to centre line equals banker inner edge to centre line, and both totals are nearer the divider than the felt's rim.

Question:
Does this delta also re-anchor the Panda 8 and Dragon 7 celebration bursts to .hand-cards, or does that pre-existing mis-anchor get filed as its own backlog item the way felt-column-overflow was?

Rationale:
Claude drafted the opposite — fix it here, it is three lines, it lives in handles this delta already opens — and flagged in the same breath the counter it suspected would win. It won.

Codex refused the fold-in on two grounds. First, the factual one: this delta does not create or worsen the defect. The burst fires from the centre of the felt's whole left half; today the cards sit flush LEFT of that point, afterwards flush RIGHT of it. Wrong by the same distance, mirrored — not degraded. Second, the precedent: felt-column-overflow (item 0fh40zqc) was deliberately FILED rather than fixed in flight during the last UI pass, and taking the opposite path now, unasked, while Jim is AFK, would make the repo's own convention mean nothing.

The cost of being right about the fix is not the point. A delta that stays reviewable against one destination sentence is worth more than three lines of adjacent correctness smuggled into it, and the bug item carries everything needed to fix it in five minutes when it is picked up.

What would overturn this: Jim saying to fold small adjacent fixes in — which would be a change to the repo's convention, not to this ticket.
