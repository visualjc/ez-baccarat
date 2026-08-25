---
run: tt0pbyw5
item: 7rfz93dh
status: success
summary: Fixed responsive clipping, true FAST timing, animation contract, engine presentation seam, storage guards, focus order, and regressions.
---

## Completed findings

1. **1280px table clipping:** Added global border-box sizing and converted the wager strip to a fluid five-track grid with bounded minimums. Bet wrappers now fill their assigned track rather than imposing fixed inline widths, so the table stays inside its grid column at the 1280px panel breakpoint.
2. **FAST:** The round timeline now uses cancellable waits throughout card dealing, flipping, third-card emphasis, banner entry, and settlement. FAST resolves the active wait immediately, applies the `.speed-fast` CSS scope, and uses the contract's `0.25` speed scale for both JavaScript delays and CSS animation/transition custom properties. The settlement/banner wait is also cancellable.
3. **Named animations:** Added and wired `deal-slide`, `card-flip`, `third-card-emphasis`, `chip-place`, `chip-lift`, `win-sweep`, `win-payout`, and `burn-expose` keyframes. Durations/easing are token-driven, including 90ms payout, 140ms deal, and 200ms sweep/push timing. Burn exposure now slides and reaches the required 1.25 scale.
4. **Storage reads:** Added a guarded storage-read helper and use it for bankroll and selected-chip persistence, matching existing write-side fallback behavior.
5. **Engine as UI math authority:** Added the additive `RoundResult.presentation` surface for per-card running totals and tableau narration. `table-view` now builds its timeline only from that engine output; it no longer totals cards or constructs tableau text itself.
6. **Keyboard focus order:** Assigned explicit tab order: chip tray, Panda/Player/Tie/Banker/Dragon spots, Clear/Rebet/DEAL, then header controls.
7. **Regression coverage:** Added headless tests for FAST scale math, throwing-storage fallback, engine presentation values, and table-timeline consumption of engine totals/narration.

## Verification

- `/Users/jimcarter/.bun/bin/bun run build` — passed
- `/Users/jimcarter/.bun/bin/bun test` — passed: 40 tests, 342 assertions

`nahel` itself was unavailable on this shell (`command not found`), so no CLI journal/log operation could be made. No git commit was created.
