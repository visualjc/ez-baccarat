---
run: va8jgwpr
item: 7rfz93dh
status: success
summary: Review found confirmed responsive/fast-forward defects plus spec, storage, and seam gaps.
---

## Findings

1. **P1 — 1280px Trainer layout clips game-critical content.** Confirmed by the recorded drive: `appshell-transcript.txt`, defect 1 reports the Player hand and Panda spot partially off-canvas at 1280×900. At this breakpoint the main grid reserves 320px for the panel (`src/styles/app.css:145-150`, `871-890`), while `#table-view` is `width: 100%` with 22px horizontal padding but the default content-box sizing (`181-194`), so its outer width exceeds its grid track. Its non-wrapping bet row also has fixed widths (`494-503`, responsive widths `878-890`). The surface is then clipped by `overflow: hidden` (`193`), hiding the Player cards during a round.

2. **P1 — FAST is not a real fast-forward.** Confirmed by `appshell-transcript.txt`, defect 2: FAST still takes 2–4 seconds. `fastForward()` only changes `speedScale` and resolves the currently tracked `wait` (`src/ui/round-timeline.ts:134-138`). The card flip itself is an independent, already-created `setTimeout` (`src/ui/card-el.ts:75-79`), and the next animations still run through sequential slide/flip/wait calls (`round-timeline.ts:107-123`, `150-163`). Existing CSS transitions are not shortened when `.speed-fast` is added. The result cannot meet the design contract's near-immediate completion.

3. **P1 — required animation contract is largely absent.** `src/styles/anim.css:14-78` defines only `shoe-shake`, `total-tick`, banner, particle, wash, and burn-fan keyframes. The normative `deal-slide`, `card-flip`, `third-card-emphasis`, `chip-place`, `chip-lift`, `win-sweep`, and `win-payout` animations do not exist; corresponding flows are transitions or instantaneous DOM changes (`src/ui/round-timeline.ts:100-127`, `src/ui/bet-spot.ts:97-118`, `src/ui/table-view.ts:226-238`). This also omits required 90ms/140ms/200ms staggers and push pulse/payout movement. Named animation, duration, and easing fidelity is therefore not reviewable as compliant.

4. **P2 — localStorage reads can crash the app in restricted contexts.** Writes are protected, but initial reads are not: `src/ui/bankroll.ts:51` and `src/ui/chip-tray.ts:22` call `window.localStorage.getItem` outside `try/catch`. Browsers can throw `SecurityError` when storage is disabled; either throw occurs while mounting the game and prevents play, contrary to the intended graceful storage handling.

5. **P2 — table UI re-derives game math rather than consuming engine-result values.** `src/ui/table-view.ts:63-80` derives totals and a tableau explanation from card values/lengths, and `src/ui/round-timeline.ts:82-88` independently calculates displayed totals. The settlement/net seam correctly uses engine payout fields (`src/ui/state.ts:70-101`, `src/ui/table-view.ts:223-224`), including Dragon push; however, the UI creates a second rules presentation path that can diverge from the engine. The review contract requires the engine to remain the sole math authority.

6. **P2 — no automated test protects either observed defect or the UI seam.** `src/ui/state.test.ts` covers pure reducer arithmetic only; all assertions can fail, so I found no literally non-failing assertion. But it has no DOM/game/timeline test for responsive sizing, FAST completion, storage exceptions, keyboard map, or that UI presentation uses engine outputs. The existing Dragon test uses a hand-authored `Settlement` fixture (`state.test.ts:67-84`), so it cannot detect an integration mismatch between `dealRound` and UI bankroll application.

## Positive checks

- `src/styles/tokens.css` matches the design token block line-for-line.
- Seed parsing and header formatting are wired (`src/main.ts:10-12`, `src/ui/seed.ts`).
- The five bet spots are real buttons with refreshed descriptive labels, and visible focus styling is present (`src/ui/bet-spot.ts:30-92`; `src/styles/app.css:24-27`). Keyboard mappings cover the specified keys and ignore modifier/input presses (`src/ui/keyboard.ts:19-79`).
- Bankroll settlement takes the signed payout multipliers supplied by the engine, and the Dragon Banker push is preserved. The drive transcript also observed a correct -$50 settlement.

No code was modified. `nahel` CLI was unavailable in this execution environment, so no Nahel journal command could be run.
