---
run: szn323a0
item: m1gajaze
responsibility: review
created: 2026-08-25T18:03:20Z
---
# Re-review: PR #4 — card face

You reviewed `feat/card-face-declutter` (nahel item `m1gajaze`) and returned REQUEST CHANGES with one finding:

> `src/ui/card-el.ts:28` hides every face glyph from assistive technology, but `src/ui/table-view.ts:193` announces only `card.rank`, not its suit. A sighted player receives the complete card identity from the face; a screen-reader user no longer does. Before keeping the face `aria-hidden`, announce a full card identity (rank plus a spoken suit) in `#app-status`, or provide an equivalent accessible name.

Addressed in the follow-up commit. See:

    git log -p -1

New in `card-el.ts`: `suitOf(card)` (the existing deck-position derivation, now exported) and `spokenCard(card)` returning e.g. "king of hearts" / "9 of spades". Both announcement paths use it:

- `table-view.ts` `onCardSeen` -> "Player 1st card king of hearts."
- `burn-ritual.ts` -> "Burn card king of spades, burning 10 cards." The on-felt callout also gains the suit glyph ("BURN CARD · K♠ · burning 10 cards") so the visible and spoken strings carry the same information; the callout stays aria-hidden because the live region already speaks it.

`src/ui/card-el.test.ts` is new: it pins the suit cycle and the spoken forms for face ranks, ace, ten and numbers. Suite is 75 pass / 3509 asserts; `bunx tsc --noEmit` clean. Host-verified in the browser that the burn pill now reads `BURN CARD · K♠ · burning 10 cards`.

## Decide

1. Does this close the finding — is the spoken identity now equivalent to what the face shows?
2. Is splitting visible text (glyph) from spoken text (words) in `burn-ritual.ts` correct, or should one string serve both?
3. Anything new introduced by the follow-up commit — dead exports, wrong pluralisation, an announcement that now says too much during fast-forward.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

Do not re-litigate what you already cleared.
