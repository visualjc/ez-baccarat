# Grill brief — hand-geometry (ez-baccarat)

You are the SECOND agent in a cross-agent grill. Your job is to **probe and refute**, not to agree.
Agreement that adds nothing is a failed grill. For each question below: attack the drafted position,
name the strongest case against it, and say either what should change or exactly why it survives.

## Destination (fixed — not up for debate)

Both hands are seated against the centre line the way a live EZ Baccarat layout is dealt:
each seat's two-card group holds its INNER edge the same measured distance off the divider,
each seat's total rides beside the divider instead of at the felt's outer edge, and each
sideways third card lies OUTBOARD of its own group — the player's to its left.

The human's brief, verbatim in spirit: *"I want the player score to be centered and to the left
of the center line, not to the far left. Also, we should have the players first two cards so that
the right edge is equal distant from the left part of the center line and the third card is the
left (and sideways) like the reference image."* He is 100% AFK and cannot be asked.

## Current code (facts, verified)

`src/styles/app.css`:

```css
#row-hands {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px minmax(0, 1fr);
  align-items: stretch;
  gap: 24px;
}

.hand {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "label total"
    "cards cards"
    "rule  rule";
  align-content: start;
  gap: 14px;
}

.hand-cards { grid-area: cards; display: flex; gap: 12px; min-height: var(--card-h); align-items: center; }
.hand-total { grid-area: total; justify-self: start; width: 48px; height: 34px; /* pill */ }
.hand-divider::before { content: ""; position: absolute; inset: 12px 50%; width: 1px; transform: translateX(-50%); }
.card { width: var(--card-w); height: var(--card-h); }        /* 92px x 132px */
.card.is-third { transform: rotate(90deg) translate(6px, -4px); }
```

`src/styles/anim.css`:

```css
@keyframes third-card-emphasis {
  0%        { outline-color: transparent; transform: rotate(90deg) translate(6px, -4px) scale(1); }
  25%, 67%  { outline-color: var(--gold); transform: rotate(90deg) translate(6px, -4px) scale(1.12); }
  100%      { outline-color: var(--gold); transform: rotate(90deg) translate(6px, -4px) scale(1); }
}
```

`src/ui/hand-zone.ts` appends in DOM order `label, total, cards, rule`; cards are appended to
`.hand-cards` in deal order, so the third card is appended LAST.

Already established by a resolved research ticket on this map:
- `deal-slide` is layout-agnostic: `prepareCard()` derives `--deal-x/--deal-y` from the card's own
  `getBoundingClientRect()` after a frame, so any re-alignment is followed automatically.
- The `third-card-emphasis` keyframes deliberately RE-STATE the rotation at every stop, because
  `deal-slide` runs concurrently. Mirror the rotation and you must mirror those keyframes too.
- `celebration.panda()` is handed `playerHand.element.getBoundingClientRect()` and fires particles
  from that rect's CENTRE. `.hand` is a stretched grid item filling its whole 1fr column, so the
  burst already fires from the centre of the felt's left half rather than from the cards.

House constraints: framework-free DOM, CSS custom properties in `tokens.css`, `bun test` plus
`tsc --noEmit`, `prefers-reduced-motion` honoured, and the house style wants a pure testable seam
plus a CSS-text guard (see `src/ui/table-shell.test.ts` for the `ruleBody(selector)` pattern).

---

## Q1 (ticket jteyn8q3) — mirror, or player-only?

**Drafted position: mirror both halves, expressed as one seat-driven rule, not two hand-tuned halves.**

Reasoning: the banker only *looks* seated today by accident of being the third grid column — its
content is flush-LEFT exactly like the player's, and the divider happens to be on its left. If only
the player moves, the banker's sideways third card still lands INBOARD (toward the divider) while
the player's lands outboard, and the banker's total stays outboard of its label while the player's
goes inboard. That is asymmetric against the reference photo and against the destination sentence.

**The strongest case against, which you should press:** the human named only the player. The banker's
total position was settled and human-approved under a previous item (`hand-total-placement`,
0e9kwr0h). Re-opening approved work while he is AFK may be exactly the overreach he did not ask for.

## Q2 (ticket qgy433dn) — what is the inner stand-off, and how is it expressed?

**Drafted position: do NOT invent a `--hand-standoff` token. The equality already falls out of the
existing grid; assert it in a test instead of re-deriving it in CSS.**

Arithmetic: columns are `1fr | 132px | 1fr` with `gap: 24px`. The player column's right edge is 24px
left of the divider column; the centre line is at the divider column's 50%, i.e. +66px. So a
right-aligned player group's inner edge stands `24 + 66 = 90px` off the line. The banker column's
left edge is `66 + 24 = 90px` right of the line. Symmetric by construction, at every viewport,
because both are `1fr`.

**Press this:** a symmetry that is emergent rather than declared is one refactor away from silently
breaking, and "assert it in a test" only helps if the test actually recomputes it rather than
hard-coding 90. Is a token genuinely worse than a derived invariant? What does the test have to
compute for the guard to be real?

## Q3 (ticket xyn2s5ey) — header order: which of label/total takes the inboard slot?

**Drafted position: the TOTAL is inboard on both seats, the label outboard.**

For the player this is `label total` right-aligned as a group. For the banker it means flipping to
`total label`, so the two badges sit either side of the divider — matching the reference mobile
layout where the two scores read together across the centre.

**Press this:** it flips the banker's header, which the human did not ask for (see Q1). It also puts
the visual order out of step with DOM order on the banker — check whether that actually harms the
screen-reader reading of "BANKER, 4", or whether it is a non-issue.

## Q4 (ticket y6344y07) — room for the sideways third card

**Drafted position: reserve the space with symmetric inline margins, and DROP the `translate(6px, -4px)` nudge.**

`rotate()` does not change the layout box, so a rotated 92x132 card occupies a 92px flex track while
painting 132px wide — 20px of overhang on each side. Proposal:
`.card.is-third { margin-inline: calc((var(--card-h) - var(--card-w)) / 2); }` (= 20px each side),
which makes the flex row reserve the painted width, and then `transform: rotate(90deg)` alone,
mirrored per seat, with the nudge deleted as the overlap compensation it was.

**Press this:** does dropping the nudge change the look in a way the human would notice and dislike?
Is `margin-inline` right, or does the overhang belong somewhere else (a wrapper, a wider track,
`writing-mode`)? And what happens vertically — the rotated card paints 92px tall inside a `min-height:
132px` row, so does the third card now sit visually higher or lower than its neighbours?

## Q5 (ticket ymggceax) — what proves this in CI?

**Drafted position: a pure arithmetic seam plus a CSS-text guard.**

Seam: a pure function computing each seat's inner-edge offset from the row's track sizes
(`1fr | divider | 1fr`, gap), with the test asserting
`centreLine - playerInnerEdge === bankerInnerEdge - centreLine` — recomputed, never hard-coded 90.
Guard: `ruleBody()` assertions that the player rule right-aligns and reverses, and — the one that
matters — that `.card.is-third`'s transform for each seat is character-identical to the transform
re-stated inside the `third-card-emphasis` keyframes, since that pairing is the trap the research
ticket found.

**Press this:** is a pure function over track sizes a real seam or ceremony around arithmetic nobody
will get wrong? Would the guard actually fail on the regression it exists to catch — mutate the CSS
in your head and check. Is there a cheaper proof that catches more?

## Q6 (ticket sx76p56m) — celebration anchor: in this delta, or its own item?

**Drafted position: fix it here — expose the cards element on `HandZoneHandle` and pass that rect.**

It is roughly three lines, it lives in the same handles this delta already touches, and the burst
firing from the wrong half of the felt is exactly the kind of thing a reviewer would flag as
"you were right there".

**Press this hard.** The honest counter is that the mis-anchor is NOT made worse by this delta —
today the burst fires to the right of the player's cards, afterwards to their left; wrong by the
same distance, just mirrored. The repo has a live precedent for the other choice: `felt-column-overflow`
(0fh40zqc) was FILED rather than fixed in-flight, deliberately. Which precedent governs, and why?

---

## Output format

For each of Q1-Q6, respond with exactly:

```
### Q<n> — <AGREE | CHANGE | REJECT>
Attack: <the strongest argument against the drafted position>
Verdict: <what should actually be done, in one or two sentences>
Why: <what survives the attack, or what breaks>
```

Be concrete about CSS and about this repo's files. If a drafted position is simply wrong, say so plainly.
