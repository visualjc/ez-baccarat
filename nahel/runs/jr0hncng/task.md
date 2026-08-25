---
run: jr0hncng
item: m1gajaze
responsibility: review
created: 2026-08-25T17:56:49Z
---
# Review: PR #4 — feat(cards): one index per corner, one pip in the middle

Reviewer for nahel item `m1gajaze`, third of five PRs in a UI polish pass. Branch `feat/card-face-declutter` (checked out) against `main`:

    git diff main...feat/card-face-declutter

Do not push, merge, or edit product code.

## The claim

`createCard()` in `src/ui/card-el.ts` built four glyph groups on `.card-face`: a corner index top-left, a big centre suit, a serif rank shoved down over that suit (`.card-center`, `align-self: end` + `translateY(18px)`), and a rotated corner index bottom-right. The third rank overlapped the bottom index — that is the "3rd number" the owner reported. Separately, the face grid's areas were `"top ." / ". center" / ". bottom"`, so the centre pip was in column 2 and sat at x=62 on a 92px card, i.e. never centred.

The face now holds exactly: corner index top-left (rank stacked over suit), the same rotated 180 degrees bottom-right, one centre pip — on a single-column grid. `.card-center` is deleted from both the DOM and the stylesheet. Glyph sizes derive from `--card-w`.

`.card-face` also gains `aria-hidden="true"`, on the argument that `backface-visibility: hidden` does not hide a face-down card from the accessibility tree and `onCardSeen` already narrates every card into `#app-status`.

Host measurements after the change: pip 0px off centre in both axes, symmetric 9px corner insets, no glyph overlaps, `.card-center` count 0.

## Specifically check

1. **Dead references.** Is every `.card-center` reference gone (TS, CSS, tests, design docs)? Does anything else in the codebase read `.card-rank-top` / `.card-rank-bottom` textContent, which changed shape from "8♦" in one span to two nested spans?
2. **The `is-third` rotation.** `.card.is-third { transform: rotate(90deg) ... }`. With indices now two-line stacks, does a rotated third card still read correctly, and does the taller index change the face's intrinsic layout inside a 92x132 (or 76x108) box?
3. **`aria-hidden` on the face.** Sound, or does it hide something a screen-reader user needs that `#app-status` does not already say? Is it in scope for this PR or should it be split?
4. **Type scale.** `calc(var(--card-w) * .2 / .15 / .38)` — legible at the 76px breakpoint? Any risk of sub-pixel or rounding artefacts?
5. **Regressions.** The opening burn's exposed card uses `createCard()` at `--burn-scale: 1.25`; the burn grid's minis do not use `.card-face` or `.card-back` at all. Confirm both. Also confirm `root.dataset.rank` / `.suit` and the `is-red` branch are unchanged, since QA probes read the dataset.
6. Anything else you would block on.

Run `bun test` and `bunx tsc --noEmit` if available; if bun is not on your PATH, say so rather than guessing.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

then numbered findings with file:line and a concrete fix. Be adversarial; the author is an LLM. Do not invent findings to look thorough.
