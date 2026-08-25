---
run: q2c7yq7b
item: 03ctcktt
responsibility: review
created: 2026-08-25T17:46:53Z
---
# Re-review: PR #3 — tray

You reviewed `fix/tray-rhythm` (nahel item `03ctcktt`) and returned REQUEST CHANGES with two findings:

1. The 1239px restack breakpoint is too low — at 1240 the tray content (~788px for three buttons, ~902px for four) exceeds the 728px felt, so the overflow survives just above the breakpoint and a fourth button would not fit until ~1415px.
2. The <=859 block resets child placement but leaves the <=1239 `grid-template-rows: auto auto` and `row-gap: 12px` in force.

Both are addressed by dropping the tracks-plus-breakpoint approach entirely. See:

    git diff 5545ad9..HEAD -- src/styles/app.css

(or `git log -p -1`). `#row-tray` is now a wrapping flex row; the `<=1239` restack block and its per-child placements are deleted; `<=859` only switches the same flex row to a column; the table's tray grid row is `minmax(104px, auto)` (and `minmax(92px, auto)` at <=859) so a wrapped tray can grow.

`.tray-chips { flex: 1 1 auto }` lets the chips absorb the slack and centre in it.

## Host measurements after the change, with a simulated fourth button (72px "2x") injected into `.actions`

| viewport | lines | result |
|---|---|---|
| 1440x900 | 1 | bankroll / chips / cluster on one line, chip span centre 374 vs row centre 522, gaps 88px each side |
| 1240x900 | 2 | bankroll + chips on line 1; cluster on line 2 flush to the felt's right gutter (786 == 786), no overflow |
| 1000x900 | 2 | cluster inside the tray box |
| 820x900  | 3 | single column, all controls full width |

## One thing you should check independently

At vw 1000 the TABLE still clips 168px horizontally (`#table-view.scrollWidth - clientWidth === 168`). I measured this on `main` with the tray change stashed and got **the identical 168px**, so it is pre-existing and not caused by this PR. Cause: `#row-bets` min-content is 668px (five spots at 152/208/168/208/152 plus gaps) against a 500px felt content box, and a grid item cannot be narrower than its min-content, so the single column widens and `overflow: hidden` cuts the right side. Filed as nahel item `0fh40zqc` for the bet row to fix.

Please verify that claim rather than taking it on trust — if you think this PR is on the hook for it, say so.

## Decide

1. Does wrapping actually close finding 1, at every width rather than at a chosen one?
2. Is finding 2 closed by construction (no grid on `#row-tray` any more)?
3. Is `minmax(104px, auto)` on the tray row safe given the sibling `minmax(228px, 1fr)` row — can the table now grow beyond its container in a way that matters?
4. Is `.tray-chips { flex: 1 1 auto }` plus `.tray-actions { margin-left: auto }` coherent, or is one of them dead weight?
5. Anything new introduced.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

Do not re-litigate what you already cleared. Do not invent findings.
