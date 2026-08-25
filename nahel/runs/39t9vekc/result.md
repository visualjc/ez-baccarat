---
run: 39t9vekc
item: 9x1w62ms
status: success
summary: Fixed banker third-card draw logic so total 6 draws only on player-third cards 6 or 7, matching standard baccarat rules.
---

Implemented the fix in `src/engine/rules.ts`:

- Updated `shouldBankerDraw` for `bankerTotal === 6` from `playerThirdValue >= 6` to `playerThirdValue >= 6 && playerThirdValue <= 7`.
- This aligns the rule table with standard baccarat behavior and the expectations defined in `engine.test.ts`.

Validation context:

- Did not run tests locally because `bun` is unavailable in the sandbox (as noted in the task).
- The host test run is expected to be re-run after submission.
- No additional files were changed.
