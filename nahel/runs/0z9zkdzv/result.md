---
run: 0z9zkdzv
item: fc5v6szj
status: success
summary: Adversarial count probe covers exact opening and round math, burn exclusion, inclusive thresholds, and trace continuity with no defect found.
---

# QA — engine-counts

Added the permitted independent probe at `src/engine/counts-qa-probe.test.ts`; no existing source or test file was modified.

Evidence covered by the probe:

- A 416-card deterministic shoe opens on a 9 and immediately reports Dragon running `+2`, Panda running `+4`, `seenCount = 1`, and exact true counts `104/415` and `208/415` before round one.
- All nine face-down burn cards are deliberately eights, whose nonzero tags would produce an obvious `+18/-18` corruption. The opening counts remain `+2/+4`, proving those cards do not move either running count.
- The known natural round is dealt `A, 2, 7, 3`. Hand arithmetic is Dragon `2 + 0 + 0 - 1 + 0 = 1` and Panda `4 + 1 + 1 - 1 - 2 = 3`. The probe asserts exact post-round state with five seen cards, decks remaining `411/52`, and true counts `52/411` and `156/411`.
- Threshold boundaries assert Dragon `4.0` ON and `3.9999` OFF; Panda `11.0` ON and `10.9999` OFF.
- A one-card-at-a-time sequence asserts every transition's `after` signal pair exactly equals the next transition's `before`, then verifies the final running counts and seen count.

Verification performed here:

- `./node_modules/.bin/tsc --noEmit` — exit 0, including the new probe.
- Bun is not available on this worker's PATH, as the task anticipated, so the host must run `bun test src/engine/counts-qa-probe.test.ts` for execution evidence.
- The Nahel CLI is also unavailable on this worker's PATH, so `nahel brief` and event logging could not be run; the full task, PRODUCT.md, CONTEXT.md, implementation, fix report, and available drive artifacts were inspected directly.

Verdict: **pass** — source inspection and the compiling adversarial oracle agree with the required count math; host execution of the new Bun probe is the remaining evidence-collection step.
