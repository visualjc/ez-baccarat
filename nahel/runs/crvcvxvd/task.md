---
run: crvcvxvd
item: 03ctcktt
responsibility: review
created: 2026-08-25T17:37:08Z
---
# Review: PR #3 — fix(tray): stop the action buttons overflowing the chips

Reviewer for nahel item `03ctcktt`, second of five PRs in a UI polish pass. Branch `fix/tray-rhythm` (already checked out) against `main`:

    git diff main...fix/tray-rhythm

Do not push, merge, or edit product code.

## The claim

`#row-tray` was `grid-template-columns: minmax(180px, 1fr) auto minmax(240px, 1fr)`. An explicit `minmax()` minimum overrides the automatic min-content floor, so the `.tray-actions` track resolved to 318px while the button cluster's min-content is 376px; `.actions { justify-content: flex-end }` then spilled the overflow LEFT across the chip tray. Measured on main: at 1440x900 Clear sits 40px under the `1000` chip; at 1200x860 the overflow is 118px and Clear is entirely hidden.

The fix is `grid-template-columns: max-content auto max-content` with `justify-content: space-between` and a new `--tray-gap` token, plus a restack at <=1239 (bankroll + chips on row one, buttons full width on row two, table's last grid row 104 -> 120px) and a placement reset in the <=859 block.

Host measured after the change at 1440x900: bankroll->chips 106px, chips->buttons 88px, buttons->rim 20px. At 820x900 the single-column stack still works.

## Specifically check

1. **Is the diagnosis right?** Does an explicit `minmax(240px, 1fr)` really override the min-content floor, and is `max-content` the correct replacement — or would `minmax(min-content, auto)` / `fit-content` be more honest? Say which you would ship.
2. **Cascade correctness.** The <=1239 block now sets `#table-view { grid-template-rows }` and per-child `grid-column`/`grid-row`. The <=859 block *also* sets `#table-view { grid-template-rows }` and `#row-tray { grid-template-columns: 1fr }`, and comes later in the file. Trace the cascade at 820px wide: does every declaration the 1239 block introduces get properly reset, or does something leak? Pay particular attention to `grid-template-rows: auto auto` and `row-gap` on `#row-tray`, which the 859 block does NOT reset.
3. **Does the 4th button (2x, shipping in a later PR) still fit?** The claim is ~90px of headroom at 1440 and ~336px spare in the narrow row two.
4. **`min-width: 5ch` + `tabular-nums`** on `.bankroll .value` — sound, or a band-aid over a track-sizing choice that should not wobble in the first place?
5. Regressions: chip flight origin (`chip-tray.ts` / `bet-spot.ts` read live rects), the `.speed-fast` path, anything keyed to the old tray metrics.
6. Anything else you would block on.

Run `bun test` and `bunx tsc --noEmit` if they are available; if bun is not on your PATH, say so rather than guessing.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

then numbered findings with file:line and a concrete fix. Be adversarial; the author is an LLM. Do not invent findings to look thorough.
