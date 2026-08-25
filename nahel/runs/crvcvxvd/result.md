---
run: crvcvxvd
item: 03ctcktt
status: success
summary: Review requests responsive cascade and breakpoint fixes before merge.
---

Reviewed `main...fix/tray-rhythm` without changing product code.

`bun` and `bunx` are not on PATH, so `bun test` and `bunx tsc --noEmit` could not run. `git diff --check` reported no whitespace errors.

The diagnosis is correct: a fixed `minmax(240px, 1fr)` minimum prevents the action track from gaining its automatic min-content floor, while the button flex row cannot shrink to fit. `max-content` is appropriate here: the actions are deliberately an unwrapped, atomic cluster, and the responsive restack is the correct escape hatch. `minmax(min-content, auto)` would also be truthful but gains nothing for this unwrapped content; `fit-content()` would reintroduce a cap that needs a separate overflow policy.

`min-width: 5ch` plus `tabular-nums` is a sound, localized stabilization for the deliberately content-sized bankroll track, not a substitute for the grid fix. The chip and card-animation origins read live `getBoundingClientRect()` values after layout; this CSS-only change does not freeze or otherwise invalidate them. The `.speed-fast` rule is likewise independent of tray metrics.

VERDICT: REQUEST CHANGES

1. `src/styles/app.css:984` — The 1239px breakpoint is too low for the new desktop tracks. At 1240px, the desktop left column is `1240 - 32 - 16 - 380 = 812px`; after the table's 84px inline padding, the tray content box is 728px. The current minimum content is roughly `80 + 296 + 376 + 36 = 788px`, so the three existing buttons already overflow for part of the 1240–about-1300px range. A fourth 104px button raises the requirement to about 902px and cannot fit until roughly 1415px. Move the restack breakpoint high enough for the actual minimum-width calculation (and remeasure with the fourth button), or add a separate intermediate breakpoint before shipping either this change or the fourth button.

2. `src/styles/app.css:1047` — The <=859 override resets child placement but leaves the <=1239 `grid-template-rows: auto auto` and `row-gap: 12px` in force. With one column and three tray children, the third child is placed into an implicit third row, so the comment's claimed undo is incomplete and the 92px table row retains unexpected intermediate-layout sizing/gaps. Explicitly set the intended narrow stack here, e.g. `grid-template-rows: none; row-gap: <intentional narrow-stack gap>;`, and adjust the table's final row if the three stacked controls require more than 92px. Verify at 820px with all tray content visible rather than only checking that it is positioned.
