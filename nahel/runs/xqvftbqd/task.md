---
run: xqvftbqd
item: wf7yak5w
responsibility: review
created: 2026-08-25T17:27:45Z
---
# Review: PR #2 — fix(table): gutter the felt rim from the UI

You are the reviewer for nahel item `wf7yak5w`, the first of five PRs in a UI polish pass on this repo.

## What to review

Branch `fix/rail-gutter` against `main`. Get the diff with:

    git diff main...fix/rail-gutter

The working tree is already on that branch. Do not push, do not merge, do not edit product code.

## What the change claims

`#table-view { padding: 22px }` and `#table-view::before { inset: 22px }` were the same value, so the table's content-box edge and the felt's gold inner rim were the same line — Discard, Shoe, Panda 8, Dragon 7, Bankroll and DEAL all sat flush against the rim with zero gutter.

The fix splits that one number into two tokens in `src/styles/tokens.css`:

- `--rail-w: 22px` — the wood rail's thickness, i.e. the felt's inset. Must be used by `#table-view::before` (the felt), `#table-view::after` (noise overlay) and `.burn-scrim` (the opening burn's dimmer).
- `--felt-gutter: 20px` — breathing room between the rim and the nearest UI element. Must apply to `#table-view`'s padding and NOTHING else.
- `--felt-radius` — replaces three inlined copies of `calc(var(--rail-radius) - 10px)`.

Responsive: `--felt-gutter` drops to 14px at `max-width: 1239px` and 10px at `max-width: 859px`.

`src/ui/table-shell.test.ts` is new: it reads the stylesheet as text and asserts the three `inset: var(--rail-w)` sites, the single padding site, no surviving `inset: 22px`, no surviving inlined radius arithmetic, and a monotonically decreasing gutter across breakpoints.

## Specifically check

1. **The trap.** If `.burn-scrim` (app.css, `.burn-scrim` rule) ever insets by rail + gutter instead of rail alone, the opening burn draws a bright ring inside the gold rim. Confirm it takes `--rail-w` alone. Same for `::before` and `::after`.
2. **Completeness.** Is there any remaining hard-coded `22px` that should have become a token? (`.count-block`'s `grid-template-rows: 22px ...` is a count-panel row height and is unrelated — it should NOT change.)
3. **Is the CSS-text test honest**, or does it merely restate the diff? Would it actually catch the regression it claims to catch? Say so plainly if you think it is theatre.
4. **Responsive values.** Is a three-step gutter (20/14/10) justified, or is it over-fitting? The stated reason is that the tray row is already tight at 1200px wide.
5. **Regressions.** The burn ritual's `.burn-stage` is anchored at `left: 25%; top: 50%` of the table's padding box; the box is now 40px taller and 40px narrower in content terms. Does anything else key off the old padding? Check `originRect()` in `shoe-box.ts`, chip-flight origins in `bet-spot.ts` / `chip-tray.ts`, and the `celebration.ts` rects.
6. Anything else you would block on.

## How to report

Run the suite yourself if you can (`bun test`, `bunx tsc --noEmit`); if bun is not on your PATH, say so rather than guessing.

End your response with exactly one of these lines:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

followed by a numbered list of findings, each with file:line and a concrete fix. Be adversarial: the author is an LLM and will not be offended. If it is fine, approve it plainly — do not invent findings to look thorough.
