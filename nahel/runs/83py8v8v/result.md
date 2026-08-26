---
run: 83py8v8v
item: ahs5jhv9
status: success
summary: "REQUEST CHANGES: the 859px breakpoint undoes the required centred hand seating."
---

# Verdict: REQUEST CHANGES

## Finding

1. `src/styles/app.css:1099` — at widths at or below 859px, `#row-hands` becomes a single-column grid; at `src/styles/app.css:1104` the divider is hidden. The player rule still right-aligns its header and card pair while the banker rule still left-aligns theirs. Consequently, a narrow viewport places the player group/total back at the full row's right outer rim and the banker group/total at its left outer rim, with no centre line to seat against. This violates the required responsive geometry: each pair's inner edge and its total must remain adjacent to the centre line. Keep a two-seat, centre-divider layout at this breakpoint, or provide a stacked narrow-layout treatment whose intended centre line and inboard edges are explicitly preserved.

## Review checks

- The CSS-only reordering leaves the DOM and focus order in `src/ui/hand-zone.ts:34-37` intact; the player is rendered `row-reverse`, but cards remain appended and read in deal order.
- `hand-layout.ts` explicitly documents its arithmetic limitation: equal standoffs are tautological from the tracks, while the CSS topology guard catches asymmetric flanks. This is honest, though it creates a test-only duplicate of two CSS tokens (`src/ui/hand-layout.ts:18-71`, `src/styles/tokens.css:69-71`). That is a non-blocking maintainability concern, not a separate requested change.
- The custom-property transform in `third-card-emphasis` is sound: every keyframe stop resolves `--third-transform`, and the only concurrent transform animation on `.card` is `deal-slide`, which is the condition this avoids.
- At the 1239px breakpoint, the reduced `--card-w` / `--card-h` continue to drive the overhang calculation, so the third-card displacement remains proportional.

## Validation

- Baseline: `bun test` — 87 passed, 0 failed; `bunx tsc --noEmit` — passed (using `/Users/jimcarter/.bun/bin/bun` because `bun` is not on `PATH`).
- Mutated the CSS and ran `src/ui/hand-layout.test.ts` after each change. It failed as expected for: one hard-coded emphasis transform stop, asymmetric row tracks, and removal of player `row-reverse`. All temporary changes were restored; no product-code changes remain from review.
