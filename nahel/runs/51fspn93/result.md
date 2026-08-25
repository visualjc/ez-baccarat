---
run: 51fspn93
item: xa1d7wj7
status: success
summary: Reviewed the 2x wager change with no blocking findings; Bun tooling was unavailable.
---

Reviewed `main...feat/double-wager-button` with emphasis on bankroll safety.

- `planDoubleWager` and `doubleBetHistory` are pure: both clone their inputs before constructing their result. The `previous!` assertion is safe because the only path that selects `last` first assigns a truthy cloned history.
- A valid 2x plan costs exactly twice the selected history. `betLayout.rebet()` then revalidates every chip against the live bankroll predicate and restores the complete pre-action layout if placement fails. This does not reopen the prior over-wager path, and the negative-bankroll invariant remains unreachable through the UI flow.
- Busy input is gated for the X shortcut; the button is disabled while busy. The successful, unavailable, and failed placement paths announce only outside the round animation, so they do not interleave with narration.
- `syncControls()` recomputes the double plan and is reached after placements/removals, Clear, Rebet, settlement, and new-shoe state transitions. The required tab order is contiguous: 1–6 chips, 7–11 spots, 12 Clear, 13 Rebet, 14 2x, 15 DEAL, 16–18 header, 19–20 panel.
- The five new state tests pin source selection, unaffordability refusal, no-wager handling, repeatability, and input purity. Existing `rebet()` rollback is the second guard. An end-to-end test for a divergence between a successful plan and a failed live rebet would be useful future hardening, but no current execution path can create that divergence.

Verification: `bun test` and `bunx tsc --noEmit` were attempted, but both commands are unavailable on PATH in this environment. The required `nahel brief` and run-phase update could not be performed because the `nahel` CLI is also unavailable on PATH.

VERDICT: APPROVE

1. No blocking findings. No code change required.
