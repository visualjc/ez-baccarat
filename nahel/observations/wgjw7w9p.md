---
id: wgjw7w9p
name: decision-xyn2s5ey
created: 2026-08-26T22:29:20Z
tags:
  - decision
  - grilling
sources:
  - y4p7bk30
  - 7dcfatpa
  - 0df9tww1
---
The total takes the inboard slot on both seats and the label goes outboard — CSS grid-area order only, with hand-zone.ts's DOM order left exactly as it is.

Decided by resolving grilling ticket xyn2s5ey, charting: Both hands are seated against the centre line the way a live EZ Baccarat layout is dealt: each seat's two-card group holds its INNER edge the same measured distance off the divider, each seat's total rides beside the divider instead of at the felt's outer edge, and each sideways third card lies OUTBOARD of its own group — the player's to its left, per the casino reference photo. A fresh agent can tell it has arrived by measuring: player inner edge to centre line equals banker inner edge to centre line, and both totals are nearer the divider than the felt's rim.

Question:
On each seat's header line, does the TOTAL take the inboard position nearest the divider with the label pushed outboard, or does the label keep the inboard position it has on the banker today?

Rationale:
Jim asked for the player's score 'centred and to the left of the centre line, not to the far left'. Inboard-total is that request generalised: both pills flank the divider, which is also what the reference mobile layout does. For the player the header reads label-then-total right-aligned; for the banker the areas flip to total-then-label.

What the grill settled. Claude flagged the a11y objection itself and codex pressed it: flipping the banker's visual header puts it out of step with DOM order. The objection dissolves on inspection — the reorder is purely a grid-template-areas change, and src/ui/hand-zone.ts keeps appending label, total, cards, rule, so a screen reader still reads 'BANKER, 4' before the cards. That DOM order was deliberate work under item 0e9kwr0h and this decision does not touch it. Both agents reached the same answer from opposite directions, which is the only kind of agreement worth recording.

What would overturn this: moving the reorder into the DOM instead of CSS, which WOULD break the reading and must not be how this is implemented.
