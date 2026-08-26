---
id: czkdja9x
map: h629rxp2
type: research
state: resolved
blockers: []
decision: "Reordering the player's cards breaks neither the deal animation nor
  the third-card emphasis — both derive from the card's own laid-out rect — but
  it does expose a pre-existing mis-anchor: the Panda 8 and Dragon 7 bursts fire
  from the centre of the whole felt half, not from the cards."
resolution: 2knvtxkd
created: 2026-08-26T22:22:13Z
updated: 2026-08-26T22:24:45Z
---
Does reversing the player's visual card order break the deal-slide origin animation, the third-card emphasis, or the panda celebration's getBoundingClientRect anchor?
