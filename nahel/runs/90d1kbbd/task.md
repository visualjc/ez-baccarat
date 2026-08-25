---
run: 90d1kbbd
item: 4tf7cfvg
role: ui-designer
created: 2026-08-25T04:29:37Z
---
# Task — UI design for count-panel-trainer (item 4tf7cfvg), build-review/design

Design the Count panel (the trainer sidebar) for the EZ Baccarat app,
within PRODUCT.md (hard constraint 2 is the soul of this item: the panel
always shows WHY the counts moved) and PRD F3 (docs/prds/
ez-baccarat-game.md). The table view already ships from
docs/design/7rfz93dh.md — REUSE its token palette (src/styles/tokens.css)
and dock into the region it reserved (read its §"count panel seam" and the
typed interface in src/ui/types.ts / table-view). The engine emits the
F1.6 round trace (src/engine/counts.ts — CountState, trace entries with
per-card tags and before/after states).

Deliver docs/design/4tf7cfvg.md with the same rigor as the table spec
(literal values, one-pass implementable):

- Layout: both count blocks (Dragon 7, Panda 8) — running, true (1
  decimal), decks remaining, BET/NO BET signal with threshold shown;
  the per-round "why" trace list (per card: rank chip, both tag values,
  running deltas); the delta summary sentence; the collapsible tag-table
  reference card; trainer/casino visibility behavior.
- Signal states: exact colors for BET (hot) vs NO BET (rest) per side bet
  (dragon fire-orange family, panda black/white/bamboo per tokens).
- Motion: count tick animation when a value changes, signal flip
  animation, trace-row stagger — named, with durations/easings consistent
  with anim.css's existing vocabulary.
- Component inventory: plain-TS mount modules + where they read engine
  state (no re-derived math — the engine trace is the only source).
- Keyboard/interaction notes (collapse toggle, mode interplay).

Report the path + 10-line summary in your result.md.
