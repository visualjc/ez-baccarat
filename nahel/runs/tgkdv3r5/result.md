---
run: tgkdv3r5
item: 4tf7cfvg
status: success
summary: Confirmed the hinted 3.9-as-4.0 display/signal lie plus a floating-point "to-go" bug and a missing count-panel.test.ts; multi-round chain, burn-row, casino-mode and shoe-retirement behavior checked clean
---

# Adversarial review — count-panel-trainer (4tf7cfvg)

Reviewed `src/engine/counts.ts`, `src/ui/count-format.ts`, `src/ui/count-narration.ts`,
`src/ui/count-panel.ts`, their tests, `docs/design/4tf7cfvg.md`, and the
`ffnwn3fm` hand-check transcript. The transcript only hand-verifies opening
burn + round 1 of one shoe on one seed — no multi-round chain, no rounding
boundary, no casino-mode hide/reveal, no shoe retirement. That's where the
real findings are.

## Finding 1 (confirmed, high severity) — displayed TRUE count can show "at/over threshold" while the pill still says NO BET

`src/ui/count-format.ts:6-9`:

```ts
export function trueCount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Object.is(rounded, -0) || rounded >= 0 ? "" : "−"}${Math.abs(rounded).toFixed(1)}`;
}
```

This rounds **half up** to the nearest 0.1. But the bet-signal booleans compare
the **raw, unrounded** value against the integer threshold —
`src/engine/counts.ts:118-124`:

```ts
export function isDragonBetSignal(trueCount: number): boolean { return trueCount >= DRAGON_COUNT_THRESHOLD; }
export function isPandaBetSignal(trueCount: number): boolean { return trueCount >= PANDA_COUNT_THRESHOLD; }
```

For any raw true count in `[3.95, 4.0)` (Dragon) or `[10.95, 11.0)` (Panda),
`trueCount()` displays `4.0` / `11.0` while `isDragonBetSignal`/`isPandaBetSignal`
is still `false`. Verified directly:

```
trueCount(3.95)  -> "4.0"   isDragonBetSignal(3.95)  -> false
trueCount(3.951) -> "4.0"   isDragonBetSignal(3.951) -> false
trueCount(10.95) -> "11.0"  isPandaBetSignal(10.95)  -> false
```

Net effect in `count-panel.ts:29-35` (`renderBlock`): the big TRUE numeral
reads `4.0`, but `view.pill.textContent` is still `"· NO BET"`, the meter
fill sits just under 100%, and the caption reads `needs true ≥ +4 · 0.0 to go`
(see Finding 2) — a trainer showing the trainee they've crossed the threshold
when they haven't. This is the exact "3.9-as-4.0" lie the task called out,
and it's not confined to the numeral: `count-narration.ts:39` calls the same
`trueCount()` for the spoken sentence (`` `True ${trueCount(before.true)} → ${trueCount(after.true)}` ``),
so the generated sentence can read `"True 3.9 → 4.0, still under +4"` —
self-contradictory in one sentence — and the block's `aria-label`
(`count-panel.ts:35`) repeats the same lie to screen readers. One root cause,
three surfaces (numeral, narration, aria-label).

Fix direction: either make the signal check operate on the same rounded
value the UI displays, or make `trueCount()` truncate/floor toward the
threshold instead of rounding, so the display never shows "reached" before
the boolean agrees.

## Finding 2 (confirmed, medium severity) — "to go" / "over" caption uses raw `toFixed(1)`, hits classic float rounding error

`src/ui/count-panel.ts:32`:

```ts
const need = Math.abs(threshold(system) - after.true).toFixed(1);
```

Unlike `trueCount()`, which guards against IEEE754 `toFixed` artifacts by
pre-rounding with `Math.round(value * 10) / 10`, this line calls `.toFixed(1)`
directly on a float subtraction. Verified:

```
Math.abs(4 - 4.35).toFixed(1) -> "0.3"   (should read 0.4)
Math.abs(4 - 3.65).toFixed(1) -> "0.4"   (this one happens to be fine)
```

So a Dragon true count of `4.35` (13 over-threshold, `+0.35` over) renders
the caption `true ≥ +4 · +0.3 over` — off by 0.1 from the actual gap, in the
opposite direction of what `trueCount()` on the same panel would show for
the same number. `decksRemaining` is always `unseen/52`, so real running
true-count values land on ordinary non-terminating binary fractions
routinely — this isn't a contrived edge case, it'll surface in normal play.
Same class of bug as Finding 1 (naive rounding of a threshold-relative
display value) but a different code path and a different failure shape
(wrong digit vs. wrong "have I crossed it" boolean), so it's reported
separately.

## Finding 3 (confirmed, process/coverage) — no `count-panel.test.ts` exists at all

`docs/design/4tf7cfvg.md:690-691` (test plan) explicitly calls for:

> `count-panel.test.ts` (headless DOM) — event mapping of §8.1, the burn
> seeding not double-counting on round 1, `inert` in casino mode, reconcile …

```
$ find src/ui -iname "count-panel.test.ts"
(no output)
```

The directory has `count-format.test.ts`, `count-narration.test.ts`, and
`counts.test.ts` (engine), but the DOM module — `count-panel.ts`, 87 lines,
the piece that owns the `shoe:opened`/`round:start`/`card:seen`/
`round:settled`/`shoe:retired`/`mode:changed` wiring, the reconcile-vs-rebuild
branch, and casino-mode `inert` — has zero test coverage. Everything the
task asked this review to attack under "trace behavior across MULTIPLE
rounds," "casino mode," and "shoe retirement/new-shoe reset" is exercised
only by the commit message's claim of "50/50 tests" (none of which touch
this file) and by one manual browser pass covering a single round of a
single shoe. The "50/50 tests pass" claim in the commit message is true but
misleading about what it covers.

Additionally, `count-format.test.ts` (7 lines total) tests only
`trueCount(-0.01)`, `decks(7.9807)`, and `countWord(13)` — it never exercises
a value near an integer threshold, so Finding 1's exact failure mode has zero
test coverage and would not have been caught by the existing suite.

## Checked and found clean

- **Multi-round chain reset**: `clear()` (`count-panel.ts:69`) fires on both
  `shoe:opened` and `round:start`, correctly wiping the *trace list* (per-round
  display) while the running counts (`dragon`/`panda` blocks) persist across
  rounds for the life of the shoe — matches design intent (cumulative count,
  per-round trace).
- **Burn row lifecycle**: burn + face-down rows are (re-)seeded on every
  `shoe:opened`, not just the first shoe of the session, and are correctly
  cleared once round 1 actually deals — consistent with §3.5's "fresh shoe,
  no round yet" framing, not a bug.
- **UI-side re-derivation**: no counting logic is duplicated in the UI layer.
  `count-panel.ts` imports tag tables/thresholds and consumes
  `CountRoundTrace`/`CountPairSignal` directly from the engine; the only
  arithmetic performed client-side is the sanctioned threshold-relative
  "to go"/"over" subtraction (Finding 2) and cosmetic rounding.
- **Casino mode**: stays subscribed and keeps rendering into the (inert,
  aria-hidden) DOM while hidden, so re-showing after several hidden rounds
  reflects the true current state, not stale data — matches
  `docs/design/4tf7cfvg.md:547` exactly, not a bug.
- **Shoe retirement**: `shoe:retired` only toggles the retired banner;
  `game.ts` blocks further `deal()` once `shoe.retired`, so blocks/trace
  correctly freeze until the next `shoe:opened` resets everything.
- **`round trace math` engine test** (`counts.test.ts:111-118`) explicitly
  guards against the round-1 double-count of the burn card called out in the
  design doc's problem statement — that regression stays fixed.

## Not covered

Did not attempt to actually run the panel in a browser across multiple
shoes/rounds — findings 1 and 2 are established by direct calculation against
the exact functions in the diff, not by driving the UI. Recommend a
regression test asserting `trueCount()`'s rounding never crosses a threshold
boundary the raw signal hasn't crossed, plus a `count-panel.test.ts` covering
the four scenarios the design doc's test plan calls out.
