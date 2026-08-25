---
run: dhe04thc
item: 7rfz93dh
status: success
summary: UI design spec for table view + app shell written to docs/design/7rfz93dh.md — palette, layout, 13 named animations, 17-module component inventory, mouse/keyboard map, count-panel seam
---

# Result — UI design, app-shell-table (7rfz93dh)

**Deliverable:** `docs/design/7rfz93dh.md` (438 lines)

## 10-line summary

1. **Palette** is a literal `:root` token block — deep pine felt
   (`#08301F`→`#1C6E4C` radial), mahogany rail (`#4A2B18`), warm bone ink
   (`#F6F0E2`), gold as the only metallic (`#E8B84B`). No greys, no
   placeholders.
2. **Sides** are cobalt Player `#3D82DC`, crimson Banker `#C93B4C`, jade-cyan
   Tie `#1FB6A6` (deliberately off-felt so it reads); side bets are fire
   Dragon `#FF5A2D` and black/white/bamboo Panda (`#14171A` / `#F7F7F2` /
   `#63C97C`).
3. **Cards and chips** are fully specced — face `#FCFAF4` with red/black pips,
   burgundy+gold lattice back, and six chip tiers (1/5/25/100/500/1000) each
   with face, edge and text hex.
4. **Shell** is a three-row grid: header (wordmark, shoe meter, seed chip, New
   Shoe, Trainer/Casino toggle) · main (table + `#panel-slot`) · aria-live
   status line.
5. **Table view** is a four-row grid inside the rail: shoe row (shoe right,
   discard left, burn slot centre) · hand zones (Player left, Banker right,
   total discs, rotated third card) · bet arc · tray row (bankroll, chip tray,
   Clear/Rebet/DEAL).
6. **Bet arc** is PANDA 8 · PLAYER · TIE · BANKER · DRAGON 7 with exact sizes,
   shapes, fills and payout labels; the Banker spot carries a `DRAGON PUSHES`
   footnote so hard constraint 1's rule is visible on the felt.
7. **Count-panel seam** ships here as `#panel-slot` (380px column, placeholder
   inside) plus a typed `GameBus` in `src/ui/bus.ts` — `shoe:opened`,
   `card:seen`, `round:settled`, `mode:changed`, `bankroll:changed` — so item
   4tf7cfvg mounts via `mountCountPanel(host, bus)` with zero DOM coupling.
8. **13 named animations** with durations and easings as CSS variables:
   `deal-slide` 380ms (140ms stagger, engine P,B,P,B order), `card-flip`
   300ms, `third-card-emphasis` 520ms with a rule caption, `chip-place` 260ms
   overshoot, `win-sweep` 520ms / `win-payout` 420ms (pushes pulse, never
   sweep), `dragon-burst` 1200ms, `panda-burst` 1100ms, `burn-ritual`
   2600ms in three phases with the exposed card called out, plus banner,
   total-tick, shoe-shake and panel-slide.
9. **Component inventory** is 17 plain-TS modules under `src/ui/` (ADR-0001,
   no framework), each with responsibility, DOM shape hint and handle API;
   `game.ts` is the only module touching `createEngine`/`dealRound`, and the
   settlement→bankroll rule reuses the engine's signed-net payouts verbatim.
10. **Interaction** covers mouse (click to bet, shift/right-click to remove,
    click to fast-forward) and a full keyboard map — `P`/`B`/`T`/`7`/`8` for
    the five bets, `1`–`6` for chips, `Space` deal, `C`/`R`/`S`/`M`/`?`/`Esc` —
    plus focus order, aria-live narration per beat, and a reduced-motion
    fallback that keeps every state readable.

## Notes for the implementer

- The engine's `Card` has no suit field, so `card-el.ts` derives a cosmetic
  suit from `SUITS[card.id % 4]`. It never feeds back into game logic.
- Deal order in the animation spec matches `dealRound`'s actual draw order
  (Player, Banker, Player, Banker) as fixed in commit dc81436.
- A `RoundTimeline` module owns the whole per-round sequence as an ordered
  promise chain and holds the input lock; `Esc`/second `DEAL` fast-forwards by
  scaling durations rather than skipping states.
- §6 gives a seven-step implementation order sized for a single pass.

## Left undone

- Nothing in scope. Count-panel internals are deliberately out of scope
  (sibling item 4tf7cfvg); this spec reserves the region and fixes the seam.
- No code written — this item's task was the design document only.
