---
run: s8kjhjxp
item: sk6gevft
status: failure
summary: Third-card flip/reveal now fires with zero wait (visual regression); new schedule oracle never exercises the buggy code path, weakening test coverage.
---

# Solo adversarial review — pacing fix (sk6gevft)

Reviewed working-tree diff over 18a82fc: `round-timeline.ts`, `table-view.ts`,
`timing.test.ts`, `qa-probe.test.ts`, `panel-qa-probe.test.ts`. No code
modified. Ran `bun test`: 58 pass / 0 fail.

## Confirmed flaw: third-card flip/reveal fires before its own animation starts

`src/ui/round-timeline.ts:220-232` (`animateThirdCard`):

```ts
const card = await prepareCard(handle);
handle.flip();
card.classList.add("is-third-emphasis");
context.onCardSeen(step.seat, step.card, step.index, true);
if (step.ruleText) context.onThird(step.seat, step.ruleText);
await wait(thirdDuration);
```

Compare `animateInitialCard` at `round-timeline.ts:208-218`, which still does
it correctly:

```ts
const card = await prepareCard(handle);
await wait(dealDuration * 0.7);
handle.flip();
await wait(flipDuration);
context.onCardSeen(...);
context.onTotals(...);
```

`handle.flip()` (`card-el.ts:56-61`) just adds the `is-flipped` class; the
actual reveal is a CSS transition on `.card-inner` driven by `--anim-flip`
(`app.css:432`, `transition: transform var(--anim-flip) var(--ease-flip)`).
For initial cards, the code waits `dealDuration*0.7` then `flipDuration`
before telling the world the card was seen — the announcement and the
count-panel `card:seen` event fire right as the flip transition completes.

For third cards, `animateThirdCard` now calls `flip()` and immediately fires
`onCardSeen`/`onThird` in the same tick (`prepareCard` only awaits a single
rAF frame), with **no** `wait(dealDuration*0.7)` and **no**
`wait(flipDuration)` at all before the reveal. So on every third-card round
(Player or Banker draws a third card — i.e. most non-natural hands):

- The screen-reader/announce text ("Player third card 5.") and the
  count-panel's per-card trace update fire before the flip's CSS transition
  has rendered a single frame — the rank is "known" before the card visually
  turns face-up.
- `context.onTotals` for that same card is called from the *outer* loop only
  **after** `await animateThirdCard(...)` resolves (`round-timeline.ts:280`),
  i.e. after the full `thirdDuration` (520ms) — so totals now lag ~520ms
  *behind* the reveal/announcement for third cards, while for initial cards
  reveal and totals are synchronized. That's an internal inconsistency this
  fix introduced, not present before.

This is exactly the "flip revealed early" failure mode the task asked me to
attack, and it's a genuine regression against 18a82fc: the old single
`animateCard` function applied the deal+flip wait uniformly to third cards
too (see the removed code in the diff: `await wait(dealDuration * 0.7); handle.flip(); await wait(flipDuration); context.onCardSeen(...)` ran
unconditionally, with `step.isThird` only branching *after* that point). The
split into `animateInitialCard`/`animateThirdCard` dropped the wait for the
third-card path.

Net effect: not a hang, not a crash — a visible/audible-before-visual
desync on every third-card round, which given the item's history (two prior
regressions in this exact area involving the flip) is the kind of thing this
review was specifically dispatched to catch.

## Confirmed flaw: the new test oracle never exercises the buggy code path

`timelineWaitSchedule`/`roundUnlockWaitSchedule` (`round-timeline.ts:72-99`)
are pure duration-math functions. Grep confirms they're consumed **only** by
`qa-probe.test.ts` and `timing.test.ts` — `mountRoundTimeline` (the actual
DOM-driving function containing `animateInitialCard`/`animateThirdCard`) is
referenced by zero test files (`grep -rln "mountRoundTimeline" src/` →
`table-view.ts` and `round-timeline.ts` only, no `*.test.ts`).

So the qa-probe/timing test evolution:
- Old oracle (`qa-probe.test.ts` pre-diff): `specSum = 4*(380+300) + 2*(380*0.7+300+520) + 5*140` — this explicitly encoded "every card, including third cards, pays deal*0.7 + flip before its own tail wait." That shape independently pinned the deal+flip wait for third cards.
- New oracle (`qa-probe.test.ts:10-16`, `timing.test.ts`): sums to a budget where third cards contribute `durations.third` only — the deal+flip component for third cards has been silently dropped from the formula, matching the (buggy) new code rather than independently constraining it.

Since the schedule functions were already decorative relative to the real
`play()` loop (the loop hand-rolls its own waits and never calls
`timelineWaitSchedule`), the schedule test was always a shadow/duplicate
model rather than an integration test — but previously that shadow model at
least *encoded the correct duration shape* per card type. Now it encodes the
same shortcut the buggy code takes, so it can't catch this class of
regression, and no test anywhere runs `mountRoundTimeline.play()` to check
call-order (`onCardSeen`/`onTotals`/`onThird` relative to waits) directly.
This is the "WEAKENED oracle" the task asked me to check for — confirmed.

## Checked and found clean

- **fastForward no longer strands a wait.** `createTimelineWaiter`'s
  `pending` is now a `Map<timeout, resolve>` (`round-timeline.ts:113-121`)
  instead of a single `activeTimeout`/`activeResolve` pair, and
  `clearPendingWait` iterates and resolves all of them. With the initial four
  cards now animating concurrently (`Promise.all(initialAnimations)`,
  `round-timeline.ts:263-273`), multiple wait promises are in flight at once;
  the old single-slot design is what caused the "hung round" regression
  mentioned in the task, and this Map-based version drains all of them.
  `wait()` also short-circuits via the `fastForwarded` flag
  (`round-timeline.ts:124-127`) so any wait requested *after* fastForward is
  triggered resolves immediately too — no stranding on either side of the
  race. Verified: `bun test` includes a FAST full-schedule test now expecting
  `now` = 986 (was 266) and a new "FAST DEAL-to-unlocked ... within 800ms"
  test, both pass.
- **Concurrent initial-card order is preserved.** The four initial cards
  start staggered by a fixed `DEAL_STAGGER` (140ms) and each takes the same
  duration (`dealDuration*0.7 + flipDuration`) to reach its `onCardSeen`
  call, so finish times are `i*140 + duration` — strictly increasing
  regardless of the actual deal/flip magnitudes. Card reveal order (and thus
  count-panel trace order, which depends on strict deal order) can't invert.
- **`panel-qa-probe.test.ts` diff is inert.** The `expect(...).toEqual(expected.cards.map((card) => [...card]))`-style
  changes are defensive array copies (avoiding aliasing/frozen-array
  identity issues), not a weakening of the oracle's assertions — same values
  compared either way.
- **Celebrations still fire at spec.** `celebration.dragon()`/`celebration.panda()`
  (`table-view.ts:237-242`) are unconditional on `settlement.isDragon`/`isPanda`
  and run in their own layer/timer chain (`--anim-dragon` 1200ms, `--anim-panda`
  1100ms), independent of the `waitForPayout` change. The
  `waitForPayout(parseDuration("--dur-pay") + 180)` → `waitForPayout(Math.max(--dur-sweep, --dur-pay))`
  change (`table-view.ts:244`, 600ms → 520ms) only affects how soon
  `busy=false`/chips clear; it didn't cover the celebration's own duration
  before this fix either, so this isn't a new regression, though flagging
  that the margin is now exactly equal to `--dur-sweep` with zero buffer
  (previously there was slack) — worth a note, not a failure.

## Verdict

Not clean. One confirmed regression (third-card early reveal,
`round-timeline.ts:220-232`) plus a confirmed weakening of the test oracle
that specifically hides it (`qa-probe.test.ts`/`timing.test.ts`, and the
long-standing gap that `mountRoundTimeline` itself has no test coverage at
all). Recommend: restore `wait(dealDuration * 0.7)` → `flip()` →
`wait(flipDuration)` ahead of `onCardSeen`/`onThird` in `animateThirdCard`
(third cards can still start concurrently with the emphasis outline if
desired, but the reveal-then-announce ordering needs to hold), and add a
real test that drives `mountRoundTimeline.play()` with a fake `HandZoneHandle`/context
and asserts `onCardSeen` fires only after the flip wait resolves for both
initial and third cards.
