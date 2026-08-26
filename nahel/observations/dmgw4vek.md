---
id: dmgw4vek
name: decision-w4na69hp
created: 2026-08-26T22:42:47Z
tags:
  - decision
  - task
sources:
  - ntr02jb7
  - 1hjkvj6z
---
Displace the overhang instead of reserving it: a positive OUTBOARD margin against a negative inboard one, netting zero layout width — which supersedes y6344y07's symmetric margin-inline.

Decided by resolving task ticket w4na69hp, charting: Both hands are seated against the centre line the way a live EZ Baccarat layout is dealt: each seat's two-card group holds its INNER edge the same measured distance off the divider, each seat's total rides beside the divider instead of at the felt's outer edge, and each sideways third card lies OUTBOARD of its own group — the player's to its left, per the casino reference photo. A fresh agent can tell it has arrived by measuring: player inner edge to centre line equals banker inner edge to centre line, and both totals are nearer the divider than the felt's rim.

Question:
Given that reserving the rotated card's width flex-shrinks the whole hand and reserving only its inboard half leaves it on the wood rail, how does the sideways card get its room?

Rationale:
y6344y07 was answered on theory and the theory did not survive the browser. Three approaches, measured:

Symmetric reserve (the resolved decision). .hand-cards is a flex row and .card has no flex-shrink: 0, so at a 294px lane the three cards plus 40px of reserve need 340 and every card in the hand shrank from 90px to 76.67px the instant a third card landed. A visible resize mid-round.

Inboard-only reserve. Fixed the shrink (87.3px) and left the painted card 6.3px onto the wood rail — the sideways card is the OUTBOARD item in its lane, so what needed room was the side the reserve did not cover. Confirmed by screenshot, not by arithmetic.

Displacement (adopted). margin-inline outboard +overhang, inboard -overhang. Zero net layout width, so nothing shrinks: cards stay at 92px, lane overflow 0, and the painted card clears the rail by 90px at 1440 and by 8.7px at 1000. What is left is an 8px overlap onto the pair, which is what Jim's reference photo of a live layout shows.

The general lesson, worth more than the fix: a flex row of fixed-width cards has no slack, so ANY reservation is paid for by shrinking the cards. In that lane, displacement is the only free move.

Verified at 1440 (both hands three cards: standoff 90 = 90, total standoff 90 = 90, rail clearance 90 = 90, no overflow) and at 1000 (standoff 90 = 90, rail clearance 8.7px). The felt overflow visible at 1000 is the separately-filed felt-column-overflow (0fh40zqc) and is unchanged by this delta — net-zero margins leave the banker's lane content byte-identical to before.

What would overturn this: giving .card flex-shrink: 0 and widening the lane, which would make reservation affordable and displacement unnecessary.
