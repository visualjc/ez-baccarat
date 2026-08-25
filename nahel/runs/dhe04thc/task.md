---
run: dhe04thc
item: 7rfz93dh
role: ui-designer
created: 2026-08-25T03:17:15Z
---
# Task — UI design for app-shell-table (item 7rfz93dh), build-review/design

Design the UI for the EZ Baccarat table view + app shell, within PRODUCT.md
(read its Goal paragraph and hard constraints 2/3/5) and the PRD's F2 + F4.1
(docs/prds/ez-baccarat-game.md). CONTEXT.md defines the vocabulary (Table
view, Count panel, Trainer/Casino mode).

Deliver docs/design/7rfz93dh.md with:

- Palette: exact hex values (felt, accents, card faces/backs, chip tiers,
  the dragon and panda celebration colors), light on a rich table feel —
  "nice colors" is a signed requirement, no placeholder gray.
- Layout: table view (shoe position, player/banker hand zones, bet spots
  for Player/Banker/Tie/Dragon7/Panda8, bankroll + chip tray, outcome
  banner) and where the count panel docks (it is a sibling item — reserve
  its region and specify the seam).
- Animation list, named and specced (duration/easing): card slide from
  shoe, flip reveal, third-card draw emphasis, chip placement, win sweep,
  DRAGON! and PANDA! celebrations, burn ritual (exposed card called out).
- Component inventory: name, responsibility, DOM shape hints for a plain-TS
  (no framework) implementation per docs/adr/0001-stack.md.
- Interaction notes: mouse + keyboard (keys for each bet, deal, new shoe,
  mode toggle).

Also report the path plus a 10-line summary in your result.md. Keep it
implementable by a fast coding model in one pass: concrete values, no
mood-board prose.
