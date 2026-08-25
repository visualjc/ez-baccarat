---
run: e5838en6
item: sk6gevft
status: success
summary: Restored the 520ms third-card reveal wait and added a mounted-timeline oracle for it.
---

Implemented the two review fixes without changing the optimized DEAL-to-unlocked budget.

- `animateThirdCard` now waits for `thirdDuration` after starting its flip and emphasis animation, before calling `onCardSeen` or `onThird`. Totals remain emitted after that animation returns, so reveal, narration, count exposure, and totals are synchronized again.
- The overlapped schedule test now explicitly verifies both third-card entries are nonzero and equal the CSS `--dur-third` value (520ms).
- Added a focused mounted-timeline test with fake frame/timer/hand dependencies. It asserts that a third card has flipped but has not been revealed to callbacks until its 520ms emphasis wait is advanced. This fails against the prior zero-wait path and exercises `mountRoundTimeline.play`, rather than only the shadow schedule helper.

Validation:

- `./node_modules/.bin/tsc --noEmit` passed.
- `bun` is not on this worker's PATH, so I could not run the 58-test suite; dispatch explicitly assigns host verification and re-drive for that check.
- No commit was created.

The `nahel` CLI is not installed/available in this worker environment, so no Nahel CLI log entry could be made.
