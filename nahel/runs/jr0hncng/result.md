---
run: jr0hncng
item: m1gajaze
status: success
summary: Review found one accessibility regression in the card-face declutter change.
---

Reviewed `main...feat/card-face-declutter` (commit `1a4bee6`) without editing product code.

The focused diff removes every `.card-center` reference, retains the QA-facing
`dataset.rank`, `dataset.suit`, and red-suit branch, and keeps the exposed burn
card on `createCard()` while burn-grid minis remain independent card-back spans.
The fixed-size third-card transform and proportional glyph scale fit the 92×132
and 76×108 card boxes. No consumer reads the changed corner-index text shape.

`bun` and `bunx` are not on PATH, so `bun test` and `bunx tsc --noEmit` were
not run, as directed by the review task.

VERDICT: REQUEST CHANGES

1. `src/ui/card-el.ts:28` hides every face glyph from assistive technology, but `src/ui/table-view.ts:193` announces only `card.rank`, not its suit. A sighted player receives the complete card identity from the face; a screen-reader user no longer does. Before keeping the face `aria-hidden`, announce a full card identity (rank plus a spoken suit) in `#app-status`, or provide an equivalent accessible name.
