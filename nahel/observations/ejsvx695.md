---
id: ejsvx695
name: decision-czkdja9x
created: 2026-08-26T22:24:45Z
tags:
  - decision
  - research
sources:
  - 2knvtxkd
  - y9t4ab3v
  - ecq38g75
---
Reordering the player's cards breaks neither the deal animation nor the third-card emphasis — both derive from the card's own laid-out rect — but it does expose a pre-existing mis-anchor: the Panda 8 and Dragon 7 bursts fire from the centre of the whole felt half, not from the cards.

Decided by resolving research ticket czkdja9x, charting: Both hands are seated against the centre line the way a live EZ Baccarat layout is dealt: each seat's two-card group holds its INNER edge the same measured distance off the divider, each seat's total rides beside the divider instead of at the felt's outer edge, and each sideways third card lies OUTBOARD of its own group — the player's to its left, per the casino reference photo. A fresh agent can tell it has arrived by measuring: player inner edge to centre line equals banker inner edge to centre line, and both totals are nearer the divider than the felt's rim.

Question:
Does reversing the player's visual card order break the deal-slide origin animation, the third-card emphasis, or the panda celebration's getBoundingClientRect anchor?

Rationale:
Three seams were in question and they answer differently.

deal-slide: safe, structurally. prepareCard() in src/ui/round-timeline.ts waits a frame, then computes --deal-x/--deal-y as the delta between the shoe's originRect() and the card's own getBoundingClientRect(). The flight path is derived from wherever the card actually landed, so any layout change — reversal, re-alignment, a reserved track for the rotated card — is followed automatically. Nothing to update.

third-card emphasis: safe, but with one trap that must be respected rather than discovered. setRotated() adds .is-third before prepareCard runs, and the third-card-emphasis keyframes RE-STATE rotate(90deg) translate(6px, -4px) at every stop precisely so the rotation survives the deal-slide animation running concurrently (.card.is-third-emphasis is declared after .card.is-dealing at equal specificity, so its animation shorthand wins). The trap: if the player's rotation is mirrored, those keyframes must be mirrored too, or the emphasis pulse will snap the card back to the un-mirrored angle for its whole duration. A CSS-text guard is the cheap way to hold that pairing.

celebration anchors: NOT safe, and already wrong. table-view.ts hands celebration.panda() the result of playerHand.element.getBoundingClientRect(), and celebration's centerRelativeToHost() emits particles from that rect's CENTRE. .hand is a stretched grid item filling its entire 1fr column, so the burst fires from the centre of the felt's left half — today the cards sit flush LEFT of that point, and after this delta they will sit flush RIGHT of it. The Dragon 7 burst on the banker has the identical shape. This is a pre-existing defect that the delta makes newly conspicuous rather than one it causes, so it gets its own ticket rather than being smuggled into this one.

Outside-in found no authority to weigh against any of this: no published rule set — Massachusetts Gaming Commission, the California AG commission-free filing, Vegas-Aces' dealing course, Venetian's house guide — specifies where the dealer physically lays the third card. Vegas-Aces defers it to house manuals outright. The orientation is visual practice, the reference photo is the governing reference, and the app already rotates the card; only the side changes.

What would overturn this: a card whose rect is read BEFORE layout settles (prepareCard's awaited frame is what prevents that today), or a future celebration call that anchors on something other than a live rect.
