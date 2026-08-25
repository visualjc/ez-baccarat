---
run: b7mb4kfe
item: wf7yak5w
responsibility: review
created: 2026-08-25T17:32:06Z
---
# Re-review: PR #2 — fix(table): gutter the felt rim from the UI

You previously reviewed branch `fix/rail-gutter` (nahel item `wf7yak5w`) and returned REQUEST CHANGES with one finding:

> `src/ui/table-shell.test.ts:14-17` does not enforce the task's required single padding site or that `--felt-gutter` applies to the table padding and nothing else. It merely finds one unscoped matching padding declaration and requires at least one gutter reference, so it still passes after another selector starts using the gutter. Match/count the `#table-view` padding declaration specifically and reject extra gutter-bearing uses (while allowing the two breakpoint token overrides); binding each rail-inset assertion to its intended selector would make the same protection more robust.

The test file has been rewritten in response. See:

    git diff 186d98a..HEAD

and read `src/ui/table-shell.test.ts` in full.

The author reports mutation-checking the guard: insetting `.burn-scrim` by `calc(var(--rail-w) + var(--felt-gutter))` now fails two of the three tests. Product CSS is unchanged since your review.

## Decide

Does the rewritten guard actually close your finding? Specifically:

1. Is each felt-layer assertion now bound to its own selector's declaration block, and is `ruleBody()` a sound way to extract that block for these rules (note: it takes the first `}` after the selector, which is correct only for rules with no nested braces — is that true of all four selectors it is used on)?
2. Does the "exactly one consumer" count genuinely reject a second gutter-bearing rule while still tolerating the two breakpoint `--felt-gutter:` declarations?
3. Anything new introduced by the rewrite.

End your response with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

If approving, say so plainly. Do not invent new findings to look thorough; do not re-litigate points you already cleared.
