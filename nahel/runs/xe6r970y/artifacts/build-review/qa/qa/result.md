---
run: y7ww8yvk
item: 7rfz93dh
status: success
summary: Headless QA probes pass, but the browser pacing residual remains a release-blocking unexplained spec failure.
---

# QA result — app-shell-table

## Work completed

Added `src/ui/qa-probe.test.ts` and did not modify any existing source file. The probe covers:

- One engine-fed five-round shoe with Player, Banker, Tie, Dragon 7, and Panda 8 outcomes. Every wager type is live on every round, so side-bet loss paths are exercised as well as Dragon's Banker push. Expected round deltas are `-30, -30, +60, +370, +230`; bankroll moves `1000 -> 970 -> 940 -> 1000 -> 1370 -> 1600`.
- A `localStorage` getter that throws `SecurityError` during `mountBankroll`; mount falls back to 1000, a Banker bet is placed, its engine settlement is applied, and the throwing persistence path does not interrupt the flow.
- Every key in design section 5.2: five wager keys, six chip keys, Space and Enter, Backspace, C/R/S/M/?/Esc. Tab and Shift+Tab are asserted to pass through to native focus behavior, and an unknown key is ignored.
- A normal six-card timeline's exact authored wait sum and a deterministic mid-wait `fastForward()` completion.

Evidence run locally through the absolute Bun binary:

```text
bun test: 47 pass, 0 fail, 384 assertions, 9 files
qa-probe.test.ts alone: 5 pass, 0 fail, 38 assertions
tsc --noEmit: pass
vite production build: pass, 33 modules transformed
```

## Pacing-gap audit

The recorded fix transcript says `normal round 21.9s` and describes an approximately 14-second gap over its roughly 8-second comparison budget. The current source does **not** contain approximately 14 seconds of blocking waits outside the card schedule.

### Blocking waits in a normal six-card round

| Location | Wait | Contribution |
|---|---:|---:|
| `src/ui/round-timeline.ts:64-70`, executed at `:181`, `:183`, `:193`, `:223` | Four ordinary cards at `380+300`, two third cards at `266+300+520`, five 140ms staggers | **5592ms** |
| `src/ui/round-timeline.ts:127-149`, awaited at `:167-170` | One animation frame per card, with a 50ms fallback | normally about 100ms total; at most 300ms by fallback |
| `src/ui/outcome-banner.ts:70-80`, awaited at `:102` through `src/ui/table-view.ts:234` | banner-in | **320ms** |
| `src/ui/table-view.ts:166-173`, called at `:244` | `--dur-pay` 420ms + 180ms settlement tail | **600ms** |

Thus a six-card round has **6512ms** of authored blocking timers plus frame synchronization, approximately **6.6-6.8s**. The timeline itself is already **2192ms over** the design's approximately 3.4-second two-draw target because each card's deal and flip are fully serialized rather than overlapped as the animation sequencing prose implies. The two-draw schedule assertion intentionally records 5592ms and fails if that schedule changes unexpectedly.

### Holds that do not block the round

- Third-card status narration is cleared after 1400ms at `src/ui/table-view.ts:198-202`; its timer is not awaited.
- The result banner auto-dismisses after 2600ms at `src/ui/outcome-banner.ts:98-100`, followed by a 240ms banner-out timer at `:104-112`; neither prevents bankroll application or input unlock.
- Dragon/Panda celebrations clear after 1200/1100ms at `src/ui/celebration.ts:33-40`, with the duration selected at `:49` and scheduled at `:70`; this is not awaited. Particle delays at `:66` are visual only.
- Bankroll count-up lasts 300ms at `src/ui/bankroll.ts:22-35`; requestAnimationFrame work is not awaited.
- Status announcements use one requestAnimationFrame at `src/ui/shell.ts:121-125`; they add no blocking hold.
- The shoe-retired follow-up announcement waits 400ms at `src/ui/game.ts:245-248`; it is not awaited and occurs only after the crossing round settles.

### New-shoe-only waits

These are outside a normal round and cannot explain a per-round gap:

- Shoe shake: animation duration (420ms) plus a 50ms fallback margin at `src/ui/shoe-box.ts:47-67`.
- Burn expose: 55% of 500ms = 275ms at `src/ui/burn-ritual.ts:50-52`.
- Burn callout hold: 1200ms at `src/ui/burn-ritual.ts:55-63`.
- Face-down fan stagger: 40ms per burned card at `src/ui/burn-ritual.ts:69-76`.
- Burn fan: 900ms at `src/ui/burn-ritual.ts:78`.

For the maximum ten-card burn, opening a shoe blocks about **3245ms** including the shake. Even if a browser measurement starts before the initial burn and ends after a six-card round, current authored waits account for only about **9.8-10.0s**, not 21.9s. The remaining roughly 12 seconds (or the journal's approximately 14 seconds against its chosen budget) is not attributable to a source wait/hold. It needs a host re-drive with `performance.now()` timestamps at click, every `card:seen`, banner show, payout completion, and input unlock; likely categories are measurement boundaries or browser timer/frame throttling, but the present evidence cannot choose between them.

## Five-step host browser checklist

1. **Tie, deterministic first round.** Open `http://localhost:5173/?seed=4`, wait for the burn ritual to finish, click the `25` chip, click **TIE**, then click **DEAL** once. Expect Player `A,7` and Banker `3,5`, totals 8-8, a `TIE` banner, Player/Banker pushes, Tie at +8 net units, and a +$200 bankroll change for the $25 Tie wager.
2. **Dragon, deterministic first round.** Open `http://localhost:5173/?seed=60`, wait for burn, click the `25` chip, click **BANKER**, click **DRAGON 7**, then click **DEAL** once. Expect Player `4,J,Q` (4) and Banker `8,4,5` (7), `DRAGON!`, the Banker spot explicitly marked `PUSH`, Dragon marked win, no loss animation on Banker, and net +$1000 from the $25 Dragon wager.
3. **Mode toggle.** Click the header **Trainer / Casino** toggle once. Expect the Count panel to become hidden, the table to recenter, and the toggle to show Casino/pressed state; click it again and expect the panel to return without changing bankroll, wagers, seed, or shoe meter.
4. **Rebet.** After step 2 has fully settled and both spots have cleared, click **Rebet** exactly once. Expect $25 to reappear on Banker and $25 on Dragon 7 and DEAL to enable; click **DEAL**, then immediately click the felt once to fast-forward. Expect exactly one new round, no duplicate wager placement, settlement completion, and responsive controls afterward.
5. **Shoe exhaustion.** Continue the seed-60 shoe by repeating: click **Rebet**, click **DEAL**, immediately click the felt once to fast-forward, and wait for controls to unlock. When the meter reaches the cut and the crossing round settles, click **Rebet** and **DEAL** once more. Expect no card to leave the shoe and status text `Shoe retired. Start a new shoe.` Then click **New Shoe** once: because the shoe is retired there should be no confirmation dialog; expect shake -> burn ritual, round `#1`, and a refilled meter.

The host should record timestamps during steps 1 or 2 because headless source accounting cannot validate the reported 21.9-second wall-clock duration.

Verdict: **fail** — all headless correctness probes pass, but the normal six-card schedule is 5592ms versus the design's approximately 3400ms, and the larger observed 21.9s pacing gap remains unexplained by any blocking wait in the audited source.
