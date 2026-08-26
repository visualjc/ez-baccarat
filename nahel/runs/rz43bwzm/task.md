---
run: rz43bwzm
item: ahs5jhv9
responsibility: review
created: 2026-08-26T22:50:25Z
---
# Re-review PR #8 — round 2 (ez-baccarat, branch `feat/hand-geometry`)

You reviewed this branch at `ea3e9cb` and returned REQUEST CHANGES with one finding. Judge the fix.

## Your round-1 finding

> `src/styles/app.css:1099` — at widths at or below 859px, `#row-hands` becomes a single-column
> grid; at `src/styles/app.css:1104` the divider is hidden. The player rule still right-aligns its
> header and card pair while the banker rule still left-aligns theirs. Consequently, a narrow
> viewport places the player group/total back at the full row's right outer rim and the banker
> group/total at its left outer rim, with no centre line to seat against.

## What changed in response (commit `2fc0b2a`)

    git diff ea3e9cb..HEAD

The `@media (max-width: 859px)` block now carries an explicit fallback: both seats return to the
shared flush-left shape (`"label total pad"`, forward card order), the player's card lane goes back
to `flex-direction: row`, its `.hand-rule` back to `text-align: left`, and its third card takes the
banker's rotation and displacement — dealing forward makes it the rightmost item again, so the
outboard side is the right for both seats.

`hand-layout.test.ts` gained a test that walks the `@media` block with balanced braces and asserts
each of those. Three mutations were checked against it — fallback deleted, player row left
reversed, player rotation left mirrored — and all three turn the suite red.

Verified live at 820px: both seats flush at offset 0 from the row's left edge, identical rotation
matrix `matrix(0, 1, -1, 0, 4, 6)`, label before total on both, zero lane overflow.

## What to check

1. **Does the finding actually clear?** Read the 859px block at HEAD and confirm the stacked layout
   no longer seats against a missing divider. Run it yourself if you can.
2. **Is the fallback complete?** Anything the per-seat rules set at wide widths that the stacked
   block fails to undo — alignment, ordering, margins, text alignment, the rotation variable.
3. **Does the new test genuinely catch its own regression?** Mutate the 859px block and check.
4. **Anything the fix newly breaks**, at the 859px boundary itself or between 859 and 1239.
5. Re-run `bun test` and `bunx tsc --noEmit`.

Your round-1 non-blocking note — that `HAND_ROW_TRACKS` duplicates two token values — was
considered and kept deliberately: the duplication is what lets the test assert the CSS and the
arithmetic agree, and the test fails if they diverge. Say so if you disagree, but it is not being
changed in this PR.

Verdict: APPROVE or REQUEST CHANGES, findings as file:line with a concrete failure scenario.
