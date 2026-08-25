---
run: 51fspn93
item: xa1d7wj7
responsibility: review
created: 2026-08-25T18:20:13Z
---
# Review: PR #6 — feat(bets): add a 2x button beside Clear and Rebet

Reviewer for nahel item `xa1d7wj7`, the last and only behavioural PR of a five-PR UI polish pass. Branch `feat/double-wager-button` (checked out) against `main`:

    git diff main...feat/double-wager-button

Do not push, merge, or edit product code. This one deserves your most adversarial pass: it touches money.

## What it does

Adds a `2x` button between Rebet and DEAL, plus keyboard `X`.

- `src/ui/state.ts`: new pure `doubleBetHistory(history)` (chip-list concatenation) and `planDoubleWager(bankroll, current, last) -> DoublePlan`.
- `src/ui/game.ts`: `doubleBets()` applies the plan through the existing `betLayout.rebet()`; `syncControls()` disables the button when `!plan.ok`.
- `src/ui/controls.ts`: the button, `tabIndex` 14, DEAL moved to 15.
- `src/ui/shell.ts` (16/17/18) and `src/ui/count-panel.ts` (19/20): tab order shifted by one.
- `src/ui/keyboard.ts`: `double` added as a REQUIRED handler; `X` bound.
- `src/ui/qa-probe.test.ts`, `src/ui/state.test.ts`: updated/extended.
- `docs/design/7rfz93dh.md`: key map, button list, tab order.

## Decisions the author made because the owner is AFK

1. On an empty layout, 2x places the LAST bet DOUBLED (not a plain rebet). Reason given: `playRound` calls `betLayout.clearAll()` before settlement, so the layout is always empty after a round; the x1 reading would make 2x a duplicate of Rebet in the only state it is pressed from.
2. Unaffordable doubling is REFUSED and the button disables — never clamped or partially applied.
3. The gesture is repeatable (2x, 4x, 8x) until the bankroll refuses.

Challenge any of these if you think the owner's words point elsewhere.

## Specifically check — money first

1. **Can any path over-wager?** The claim is a double guard: `planDoubleWager` gates on `total <= bankroll`, and `betLayout.rebet()` re-places chip by chip through the live `canPlace` predicate with rollback. Read `bet-layout.ts` `rebet()` yourself and confirm the rollback is real. Item `h7g4w2rg` was a previously-fixed over-wager bug — make sure this does not reopen it.
2. **Is `applyBankrollDelta`'s throw-on-negative invariant still unreachable** through any 2x sequence, including 2x immediately before DEAL and 2x while a settlement is animating?
3. **Purity.** Do `doubleBetHistory` and `planDoubleWager` mutate their inputs? Is the `previous!` non-null assertion in `planDoubleWager` actually safe?
4. **`DoublePlan.total` when `!ok`.** It reports the unaffordable total while `history` is empty. Is that a coherent contract or a foot-gun for a future caller?
5. **State staleness.** `syncControls()` recomputes the plan on every call — is it called everywhere it needs to be (after settlement, after a chip placement, after Clear, after a new shoe, after Rebet)? Could the button be enabled when pressing it would fail, or disabled when it would succeed?
6. **Tab order.** Verify all five files agree, no duplicate or skipped index: chips 1-6, spots 7-11, Clear 12, Rebet 13, 2x 14, DEAL 15, header 16-18, panel 19-20.
7. **Announcements.** `#app-status` is aria-live polite. The new strings fire only in the idle betting phase — confirm they cannot interleave with card narration or the count explanation.
8. **Test honesty.** Do the five new `state.test.ts` cases actually pin the decisions above, or do they restate the implementation? Is anything important untested — in particular the interaction between `plan.ok` and `betLayout.rebet()` returning false?
9. Anything else you would block on.

Run `bun test` and `bunx tsc --noEmit` if available; say so if bun is not on your PATH.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

then numbered findings with file:line and a concrete fix. Do not invent findings to look thorough.
