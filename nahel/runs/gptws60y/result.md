---
run: gptws60y
item: x31766d8
status: success
summary: Independent PRD verification requests changes for tableau inputs, count arithmetic, and deterministic cut-card wording.
---

## Verdict

**Disagree — request changes.** I verified the PRD file's blob hash is
`7e4ed7f33f414c6a94d27605d419b6e772e11557`, matching the proposal event
`05rjqgvp`. The PRD fits the signed goal and the item backlog scope, but three
requirements need correction before delegated approval.

## Findings

1. **F1.3 makes the tableau input incomplete.** Exact punto banco Banker
   drawing cannot be a function of only the two initial hands: when Player
   draws, the Banker rule also depends on Player's third-card rank (for
   example, Banker total 3 stands against a Player third-card 8). Specify a
   pure function over the full state needed for the decision — at minimum the
   two initial totals and the Player's third card/absence — while preserving
   the natural-hand early exit.
2. **F3.2's illustrated Dragon delta is wrong.** Two 5s (`-2`), one 4
   (`-1`), and one 8 (`+2`) total **-1**, not -2. Correct the example or use a
   generated example whose arithmetic is valid. This matters because the
   trainer's stated purpose is showing exact count reasoning.
3. **F1.1's `~14 cards` is ambiguous.** The cut-card placement is a safe
   parkable implementation assumption, but the PRD also requires exact,
   deterministic game math and a seeded deterministic replay. State an exact
   value (for example, 14 cards) or a deterministic placement rule rather
   than an approximation.

## Checks that passed

- F1.2 preserves the exposed burn card as seen and face-down burns as unseen;
  this is compatible with the required count treatment.
- F1.4 has the required no-commission settlement, Dragon 7 40:1, Panda 8
  25:1, Banker push on Dragon, and tie 8:1 with main-bet pushes.
- F1.5 uses the required true-count denominator and the Dragon `+4` / Panda
  `+11` thresholds. F3 supplies running and true counts, thresholds,
  per-card tags, bet signals, and trainer/casino visibility modes.
- The item is the sole active PRD plan and its recorded scope matches F1–F4.

## Assumptions

- `6nct70qk` — tie at 8:1: safe; it matches PRODUCT.md's domain facts.
- `9tcstha5` — cut card at about 14 cards: safe only as a reversible default;
  it must be made exact in the PRD to meet determinism.
- `ez5v2xs0` — play chips in local storage: safe; it matches the signed
  play-only goal and stated non-goals.
- `rxwqayyt` — GitHub Pages delivery: safe as an optional static-hosting
  assumption, since the required static `dist/` remains independently usable.

I read the constitution and backlog through `nahel brief` / `nahel status`,
and the cited proposal and assumption events through `nahel progress`. I
recorded the required Nahel verdict as event `jadvxg97` under
`agent:codex-verifier`.
