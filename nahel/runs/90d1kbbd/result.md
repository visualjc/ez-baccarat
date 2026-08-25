---
run: 90d1kbbd
item: 4tf7cfvg
status: success
summary: Count panel UI design shipped at docs/design/4tf7cfvg.md — 787 lines, one-pass implementable, with three required additive engine/bus contract deltas flagged.
---

# Result — Count panel design (item 4tf7cfvg)

**Deliverable:** `docs/design/4tf7cfvg.md` (787 lines). No code changed.

## 10-line summary

1. **Contract deltas up front (§0).** The shipped seam is insufficient *and*
   wrong on round 1: `createEngine` already counts the exposed burn card, while
   `seenThisRoundForCounts` prepends it again — a panel folding tags over that
   array double-counts the burn for the whole shoe. Three additive fixes:
   `CountCardTrace` gains `dragonRunningAfter`/`pandaRunningAfter`,
   `RoundResult` gains `counts: CountRoundResult` (already computed and thrown
   away in `dealRound`), `EngineState`/`shoe:opened` gain `openingCounts`.
2. **Layout (§1–§2).** `#count-panel` flex column inside the reserved
   `#panel-slot`: head, two 128px count blocks (Dragon above Panda — it signals
   ~2× as often), flex trace card, delta summary, `<details>` rules card, foot.
   Every block carries running, true (1 dp), Δ this round, BET/NO BET pill and a
   threshold meter with a generated `2.1 to go` / `+0.4 over` caption.
3. **Signal colours (§2.2).** Literal CSS per side bet — Dragon hot uses the
   flame gradient (`--dragon-flame-1/2/3`) with `--dragon` border and
   `--dragon-glow` numerals; Panda hot uses `--panda-white` on `--panda-ink`
   with a `--panda-bamboo` rule and `--panda-glow` numerals. Rest states are
   muted `--ink-muted` pills on `--panel-edge`. Deviates from the seam's
   suggested shared `--win` (documented, with the reason: two green blocks are
   indistinguishable in peripheral vision); `--win`/`--lose` are still reused
   for signed delta numerals.
4. **The WHY (§3).** Per-card trace rows: mini card-face rank chip, seat glyph,
   Dragon tag + running-after, Panda tag + running-after — 310px inside the
   324px content box. Burn rows are explicit: the exposed card gets a gold ring
   and real tags; the face-down burns get a single ghost row rendering `—` (not
   `0`) because their tags are *unknown*, not zero.
5. **Delta sentences (§4).** A full deterministic grammar — bucket by tag value
   (never by rank), larger side leads, `against` joins the sides, `; N neutral`
   tail, four threshold clauses. PRD F3.2's own 5,5,4,8 example renders
   correctly for both systems (Dragon two buckets, Panda one). Lives in a pure,
   DOM-free `count-narration.ts` with tests.
6. **Motion (§7).** Four named animations in `anim.css`'s existing vocabulary:
   `count-tick-up/down` (420ms `--ease-pop`, rAF digit roll between engine
   before/after), `signal-flip-out/in` (160+220ms, text swapped at the midpoint
   with a 250ms safety timeout) + `signal-halo`, `trace-row-in` (260ms, 45ms
   stagger, in lockstep with `card:seen`), `count-reveal` (420ms, Casino→Trainer
   payoff). All go through `--anim-*` × `--speed-scale`; reduced-motion block
   extended.
7. **Fast-forward gap closed.** `.speed-fast` is applied to `#table-view`, which
   is not an ancestor of the panel — so `CountPanelHandle.fastForward()` applies
   it to `#count-panel`, called from the same places `game.ts` already calls
   `table.fastForward()`.
8. **Components (§8).** Seven plain-TS modules — `count-panel`, `count-block`,
   `count-trace`, `count-narration`, `count-summary`, `count-rules`,
   `count-format` — with the engine data each reads, a full bus-event→action
   table, and the one rule: the panel does zero count arithmetic. Provisional
   rows render on `card:seen` using the engine's own `dragonTagForRank` /
   `pandaTagForRank`, then are reconciled (or wholly replaced) by the
   authoritative trace at `round:settled`.
9. **Keyboard/a11y (§9).** No new global keys — `?` opens the rules (the
   `ezb:help` CustomEvent is already dispatched by `game.ts`), `M` drives mode.
   Tab order continues the table spec's: header controls → rules summary (18) →
   trace list (19); `inert` removes both in Casino mode. `.delta-summary` is the
   panel's only `aria-live` region so the *why* is spoken once, after the
   shell's outcome announcement. Flagged: the rules `<summary>` must
   `stopPropagation()` on Space/Enter or the global DEAL handler fires behind it.
10. **Responsive + order (§10–§12).** 380/320/bottom-sheet variants with literal
    grid changes; an 8-step one-pass implementation order starting with the
    engine deltas and the pure narration module; acceptance mapped back to
    F3.1–F3.4 and hard constraints 2 and 5.

## Things the implementer must not skip

- **§0 first.** Panel work cannot start until `RoundResult.counts` and
  `EngineState.openingCounts` exist. Extend the engine count tests to assert
  round 1 does not double-count the burn card.
- **`seenThisRoundForCounts` is a trap.** Mark it deprecated for display; the
  panel must never read it.
- **`localStorage` for `ezbac.rules` must be try/catch-guarded** on both read
  and write, matching the guards already added to `bankroll.ts` and
  `chip-tray.ts`.

## Noted, not fixed (not this item's scope)

- PRD F1.2 says the face-down burns "reduce the decks-remaining denominator
  only", while CONTEXT.md and the shipped engine treat them as **unseen**
  (included in the denominator). The engine and CONTEXT agree; the PRD line is
  the odd one out. The design follows the engine and puts the explanation on the
  panel (§3.4), because the count panel's `7.98 decks` will otherwise look like
  a bug next to the header's `407 / 416`. Worth an editorial fix to the PRD
  wording.
