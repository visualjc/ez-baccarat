---
run: bw74129y
item: 0e9kwr0h
responsibility: review
created: 2026-08-25T18:10:05Z
---
# Review: PR #5 — fix(hands): move the totals off the cards

Reviewer for nahel item `0e9kwr0h`, fourth of five PRs in a UI polish pass. Branch `fix/hand-total-placement` (checked out) against `main`:

    git diff main...fix/hand-total-placement

Do not push, merge, or edit product code.

## The claim

`.hand-total` was `position: absolute; top: 44px` with `left: calc(100% - 42px)` (player) and `right: calc(100% - 42px)` (banker), pinning each 56px disc to the inner edge of its hand zone — where the cards are. Measured on main: the banker badge (x 598-654) covered the banker's FIRST card (x 612-704) at every width in every round; the player badge floated outside its own zone and collided once a rotated third card arrived.

The fix gives `.hand` named grid areas ("label total" / "cards cards" / "rule rule"), makes `.hand-total` a 48x34 pill on the label line, deletes both `calc(100% - 42px)` rules, and reorders `root.append(label, total, cards, rule)` in `hand-zone.ts` so DOM order matches visual order.

Host measurements after: at 1440x900 and 1200x860 on rounds with a rotated third card, badges hit 0 cards and do not touch the labels, the divider, or `#round-number`.

## Specifically check

1. **Grid correctness.** `.hand` gets `grid-template-columns: auto minmax(0, 1fr)`. Does `.hand-cards` (a flex row of up to three cards, one possibly rotated 90deg) still lay out correctly spanning both columns, and can it overflow its zone at either breakpoint? `#row-hands` is `minmax(0,1fr) 132px minmax(0,1fr)`.
2. **The 859px block** sets `#row-hands { grid-template-columns: 1fr }` and hides `.hand-divider`. Does the new `.hand` grid survive that, and does the row height still work with `#table-view`'s `minmax(180px, 1fr)` there?
3. **Colour and animation.** Per-seat colour comes via `currentColor` from the `[data-seat] .hand-total` rules, which also set `border-color`. Still correct now that the element is no longer absolutely positioned? Does `anim-total-tick` still fire and look right on a 34px-tall pill (it was authored for a 56px disc)?
4. **Reading order.** Is "PLAYER, 5, [cards]" the right screen-reader order, given `#app-status` separately narrates each card and the round result? Any duplication or confusion introduced?
5. **Anything that still reads the old geometry** — celebration rects, outcome banner, third-card emphasis, the burn ritual.
6. Anything else you would block on.

Run `bun test` and `bunx tsc --noEmit` if available; say so if bun is not on your PATH.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

then numbered findings with file:line and a concrete fix. Be adversarial; the author is an LLM. Do not invent findings.
