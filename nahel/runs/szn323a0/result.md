---
run: szn323a0
item: m1gajaze
status: success
summary: Follow-up restores equivalent spoken card identity with no review findings.
---

Reviewed only `HEAD~1..HEAD` (`54fff3a`). No findings.

- `src/ui/table-view.ts:194` now announces each revealed card with `spokenCard(card)`, supplying rank and suit words.
- `src/ui/burn-ritual.ts:157-167` shows the rank-plus-suit glyph on the aria-hidden callout and sends the equivalent rank-plus-spoken-suit message to the live region. Keeping these strings separate is correct: glyphs are appropriate visual notation while words are the accessible equivalent, and the aria-hidden callout cannot be announced twice.
- `src/ui/card-el.ts:27-37` centralizes the deck-position suit derivation and rank wording. Both exports have production consumers; no dead export was added.
- `src/ui/burn-ritual.ts:156` handles singular/plural correctly. `src/ui/round-timeline.ts:196-226` still invokes one `onCardSeen` per exposed card even when fast-forward resolves waits, so this commit adds no over-announcement path.

Could not execute the supplied test/typecheck commands because `bun` is not installed in this environment. `nahel brief` and the requested run-phase update were likewise unavailable because the `nahel` CLI is not on `PATH`.

VERDICT: APPROVE
