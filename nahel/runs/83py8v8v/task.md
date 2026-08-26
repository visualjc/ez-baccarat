---
run: 83py8v8v
item: ahs5jhv9
responsibility: review
created: 2026-08-26T22:44:13Z
---
# Review PR #8 — "Seat both hands against the centre line" (ez-baccarat)

You are the reviewer. Verdict must be one of APPROVE or REQUEST CHANGES, with findings validated
against the code at HEAD of branch `feat/hand-geometry` — do not report a finding you have not
confirmed by reading the actual file.

## What to review

    git diff main...feat/hand-geometry

Files touched: `src/styles/app.css`, `src/styles/anim.css`, `src/styles/tokens.css`,
`src/ui/hand-layout.ts` (new), `src/ui/hand-layout.test.ts` (new), plus `nahel/` state records
and `docs/handoffs/hand-geometry-grill.md` (a planning artefact — not product code).

## The intent it must be judged against

The player's cards and total sat at the felt's far-left rim. Both hands should now be seated
against the centre line the way a live EZ Baccarat layout is dealt:

- each seat's two-card group holds its INNER edge the same distance off the divider
- each seat's total rides beside the divider, not at the felt's outer rim
- each sideways third card lies OUTBOARD of its own pair — the player's to its LEFT

The human's brief: *"I want the player score to be centered and to the left of the center line,
not to the far left. Also, we should have the players first two cards so that the right edge is
equal distant from the left part of the center line and the third card is the left (and sideways)
like the reference image."*

## Deliberate decisions — attack these if they are wrong, do not flag them as oversights

1. **The banker changed too.** Its cards did NOT move; only its card order stays as-is and its
   header pair flipped so its total is inboard. Judged necessary because the banker only looks
   seated today by accident of being the third grid column.
2. **`translate(6px, -4px)` was kept, mirrored per seat**, not deleted. Its purpose was never
   verified, so removing it while the human is away was judged unjustified.
3. **The sideways card is displaced, not reserved.** `margin-inline` outboard `+overhang` against
   inboard `-overhang`, netting zero layout width. Reserving the overhang was tried first and
   measurably flex-shrank every card in the hand from 92px to 77px, because `.card` has no
   `flex-shrink: 0` and the lane has no slack. Reserving only the inboard half left the painted
   card on the wood rail.
4. **The Panda 8 / Dragon 7 celebration bursts were NOT fixed here.** They anchor on the stretched
   `.hand` rect and so fire from the centre of the felt half rather than the cards. Pre-existing,
   unchanged in magnitude by this delta, filed as its own item. Same call the repo made for
   `felt-column-overflow`.

## What to check hardest

- **Does the guard actually hold?** `src/ui/hand-layout.test.ts` claims to catch eight named
  regressions. Mutate the CSS yourself and check at least three of them genuinely turn the suite
  red — especially "one emphasis stop hard-codes the angle" and "row tracks made asymmetric".
- **Is the arithmetic in `hand-layout.ts` honest or circular?** It asserts the two stand-offs agree.
  Ask whether that assertion can fail at all, and whether the test says so plainly.
- **`--third-transform` inside `@keyframes`.** The player's mirrored angle is fed to
  `third-card-emphasis` through a custom property. Is that sound across browsers, and does anything
  else animate `transform` on `.card.is-third` that could now resolve the variable differently?
- **Accessibility.** `hand-zone.ts` was not touched; the reorder is CSS `row-reverse` and
  `grid-template-areas`. Confirm the reading order is genuinely unaffected, including focus order.
- **Responsive.** `@media (max-width: 1239px)` retunes `--card-w` / `--card-h`. Does the
  displacement still hold there, and at the 859px breakpoint?
- **Anything the diff breaks that no test covers.**

Run `bun test` and `bunx tsc --noEmit`. Report findings as file:line with a concrete failure
scenario, most severe first, then your verdict.
