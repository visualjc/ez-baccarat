---
run: fxscy15m
item: 7rfz93dh
status: success
summary: Both transcript defects localized and root-caused; 5 more spec-fidelity/a11y/robustness flaws found in tokens/anim/keyboard/localStorage; engine-UI seam and state tests are clean.
---

# Adversarial panel — app-shell-table (7rfz93dh)

Reviewed `HEAD` (`c08a2ae`, code actually landed in `8bde81b` per `git log -- src/ui`)
against `docs/design/7rfz93dh.md` and the drive transcript at
`nahel/runs/xe6r970y/artifacts/build-review/implement/dev/appshell-transcript.txt`.
No code modified.

## Transcript defect 1 — 1280px layout clip: CONFIRMED, localized

Root cause: **the responsive breakpoint leaves a gap wide enough to overflow
the table at exactly the width the host tested.**

- `src/styles/app.css:871` — `@media (max-width: 1239px)` is the *only* rule
  that shrinks card/spot geometry (`--card-w`, bet-spot widths). At a
  1280px viewport this query does **not** fire, so full-size geometry from
  `docs/design/7rfz93dh.md:271` ("≥1240px: as specced") applies.
- At 1280px: `#app-main` available width = 1280 − 32 (padding, `app.css:149`)
  − 16 (column-gap) = 1232. Table column = 1232 − 380 (`--panel-w`) = **852px**.
  `#table-view` padding is 22px/side (`app.css:189`) → content box **808px**.
- `#row-bets` (`src/ui/bet-layout.ts:41-55`) lays out five spots at their
  full-size widths — 152 + 208 + 168 + 208 + 152 = 888px — plus 4×20px gaps
  = **968px** needed, flex-nowrap (no shrink, widths set as literal inline
  `style.width`, `bet-layout.ts:105`). That's 160px more than the 808px
  available.
- `#table-view { overflow: hidden }` (`app.css:193`) has no scroll/scale
  fallback, and `#row-bets { justify-content: center }` (`app.css:496`)
  centers the overflow, clipping ~80px off each side. Panda 8 (leftmost,
  152px wide) loses over half its width on the left — exactly what the
  transcript reports.
- Player hand zone: `#row-hands` itself (`app.css:305-310`, `minmax(0,1fr)`
  columns) does the math correctly and shouldn't overflow on its own, but it
  shares the same clipped ancestor (`#table-view`) that's already 160px
  short at this exact width; the deal-slide animation computes card
  positions live via `getBoundingClientRect()` (`round-timeline.ts:95-101`)
  against an ancestor that's mid-overflow, which is consistent with a card
  rendering partially outside the visible box during play.

The design's own §2.4 responsive table has a hole: "≥1240px: as specced"
assumes the full-size table (max-width 1180px) plus a 380px panel fit
together, which requires a viewport of roughly 1180+380+32+16 ≈ 1608px —
not 1240px. The implementation faithfully reproduced that gap rather than
adding an intermediate breakpoint or a scale-down/scroll fallback.

## Transcript defect 2 — FAST pacing stays slow: CONFIRMED, localized

`round-timeline.ts:134-138`:

```ts
fastForward() {
  speedScale = 0.25;
  context.tableElement.classList.add("speed-fast");
  clearPendingWait();
},
```

- `speedScale` only feeds the local `scaled()` helper, which is applied to
  (a) the JS `setTimeout`-driven `wait()` calls and (b) the inline
  `transform`/`transition` duration the deal-slide sets on each card
  (`round-timeline.ts:107`). Those two paths do shrink correctly.
- The `.speed-fast` class added to `#table-view` has **no matching CSS rule
  anywhere** (`grep -rn "speed-fast" src/` returns only the two
  add/remove call sites in `round-timeline.ts`). It's dead code. The design
  (`docs/design/7rfz93dh.md:323-325`) specifies the mechanism as a
  `--speed-scale: 0.25` custom property wired through `calc()` into the CSS
  animations — that half of the mechanism was never built.
- Consequences: the card-flip transition is CSS-native and fixed —
  `app.css:414`, `.card-inner { transition: transform var(--dur-flip)
  var(--ease-flip); }` — `--dur-flip` (300ms) is never touched by
  fast-forward, so every flip still visibly takes the full 300ms regardless
  of the click. Bigger contributor: the win-sweep/win-payout settlement
  animations aren't implemented at all (see finding 3 below), and
  `table-view.ts:236`, `await wait(parseDuration("--dur-pay") + 180)`, is a
  flat ~600ms pause before bets clear that is **never** run through
  `scaled()` — it always waits the full un-scaled duration. Between the
  fixed-duration CSS flip and this un-scalable post-settlement pause, a
  round retains multi-second stretches no click on FAST can shorten,
  matching the observed "~2-4s between reveals."

## Additional findings (not in the transcript)

### 1. Three named animations from §3 are effectively unimplemented

`grep -rn "dur-chip\|dur-sweep" src/` shows both custom properties defined
in `anim.css:3` and never referenced anywhere else in the codebase.

- **3.4 `chip-place`/`chip-lift`** — `bet-spot.ts:97-103` (`add()`) just
  creates a `<span>` and appends it into the well; no transform, no flight
  from the tray, no `--dur-chip` usage anywhere. `removeLast()`
  (`bet-spot.ts:104-111`) is equally instant. Chips snap into and out of
  existence.
- **3.5/3.6 `win-sweep`/`win-payout`** — `bet-layout.ts:245-260`'s `settle()`
  only toggles static end-state classes (`settled-win`/`settled-loss`/
  `settled-push` — `app.css:585-596`: a box-shadow glow, a strikethrough, a
  push glow). No losing-stack slide-to-rail, no winning-chip arc-to-bankroll.
  `--dur-pay` is used exactly once, in `table-view.ts:236`, purely as a flat
  delay before `betLayout.clearAll()` — not as an animation duration for any
  visual motion.

### 2. `third-card-emphasis` (§3.3) only half-implemented

`app.css:484-487`:
```css
.card.is-third-emphasis {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
```
Spec calls for "slides in at 1.12 scale, holds 220ms ... then settles to
1.0" — no scale/transform/keyframe exists anywhere for this class; only the
static outline persists for the class's lifetime. The caption fade and
`total-tick` portions of 3.3 (`hand-zone.ts:48-52`, `round-timeline.ts:196`)
are correctly implemented.

### 3. `burn-expose` (§3.9 phase A) — wrong scale, no slide

`app.css:822-824`:
```css
.burn-card.from-shoe {
  transform: translateY(-8px) scale(1.06);
}
```
Spec: card "slides from the shoe ... and flips face-up at **1.25 scale**."
Implementation uses `scale(1.06)`, and `.burn-card` has no `transition`
property at all, so the class toggle snaps instantly rather than sliding.
Low severity relative to the above, but a literal deviation from a
normative spec value.

### 4. Keyboard focus order contradicts the spec (hard constraint 5)

`docs/design/7rfz93dh.md:408` mandates: *chip tray → Panda 8 → Player → Tie
→ Banker → Dragon 7 → Clear → Rebet → DEAL → header controls*.

Actual DOM order is the reverse on both ends:
- `shell.ts:95` — `app.append(header, main, status)` — header controls
  (New Shoe / Trainer-Casino / `?`) come **first** in the document, before
  the table exists at all.
- `table-view.ts:174-175` — `rowTray.append(bankrollHost, chipHost,
  actionHost); wrapper.append(rowShoe, rowHands, betHost, rowTray, ...)` —
  the bet spots (`betHost`) are appended **before** the chip tray
  (`chipHost`, inside `rowTray`), so Tab reaches Panda/Player/Tie/Banker/
  Dragon **before** the chip tray, not after.

No `tabindex` is set anywhere in `src/ui` (`grep -rn -i tabindex src/`
returns nothing) to compensate. A keyboard-only player tabs through header
controls, then bet spots, then chip tray, then Clear/Rebet/DEAL — not the
sequence the design specifies for full-keyboard playability.

### 5. localStorage reads are unguarded while writes are guarded

- `bankroll.ts:51` — `window.localStorage.getItem(STORAGE_KEY)` is called
  with no try/catch, but the write path (`persist()`, `bankroll.ts:56-62`)
  is wrapped. `mountGame()` (`main.ts:10`) calls this synchronously at
  startup with no surrounding try/catch either.
- `chip-tray.ts:22` — same asymmetry: `window.localStorage.getItem(...)` is
  bare; `select()`'s write (`chip-tray.ts:58-62`) is guarded.

In any environment where `localStorage` access itself throws (blocked
storage, some sandboxed/embedded WebViews, hardened privacy modes) — not
just quota-exceeded on write — the app fails to mount at all instead of
degrading to the default bankroll/chip. The write-side try/catch suggests
the author was aware storage could fail but only handled half the surface.

## Clean areas — explicitly checked, nothing found

- **`tokens.css` vs spec**: byte-for-byte identical to the spec's `:root`
  block (verified programmatically) — every hex, geometry and shadow value
  matches.
- **`anim.css` durations/easings root block vs spec**: byte-for-byte
  identical.
- **Engine-UI seam / bankroll signed-net**: `state.ts`'s
  `computeBetMultipliers`/`settlementNet` read straight from
  `settlement.mainPayouts`/`sidePayouts` — no re-derivation of win/lose/push
  rules. Dragon-push math verified in `state.test.ts:67-85` (banker
  multiplier 0, dragon 40×5, tie −1×1 → net 199) — correct and matches the
  "UI never re-derives outcomes" rule (`docs/design/7rfz93dh.md:363-366`).
  The only UI-side arithmetic is the mod-10 running hand-total during the
  deal animation (`round-timeline.ts:82`, `table-view.ts:63-65`) — cosmetic
  point-count summation over engine-supplied `card.value`, not a
  re-derivation of a rule the engine already decided; defensible under the
  same carve-out the spec itself grants for cosmetic suit derivation
  (`docs/design/7rfz93dh.md:368-370`).
- **State/seed tests**: none are tautological. `state.test.ts`'s four tests
  assert non-trivial boundary values (`canPlaceChip(149, ...)` = false vs
  `canPlaceChip(200, ...)` = true; `applyBankrollDelta(25, -100)` clamps to
  0) and a hand-computed settlement net (199) that would catch a broken
  multiplier lookup. `seed.test.ts`'s three tests cover trim/blank/missing
  edge cases for the seed param and chip formatting. All would fail under
  a plausible regression — no flaw here.
- **Accessibility of the five bet buttons**: real `<button>`s, no
  `aria-pressed`, descriptive `aria-label` refreshed on every change
  (`bet-spot.ts:88-93`), global `:focus-visible` ring never removed
  (`app.css:24-27`), win/loss/push each carry a non-color signal (✓ WIN /
  LOSS strikethrough / PUSH — `bet-spot.ts:120-138`, `app.css:589-592`).
  Minor nit only: the aria-label odds format is `"1:1"` rather than the
  spec's literal example text `"pays 1 to 1"` — cosmetic, still fully
  descriptive to a screen reader, not worth blocking on.
- **Seed param / seed chip**: `fromLocation`/`formatSeedChip` behave exactly
  per spec (`?seed=` trim, RANDOM fallback, 4-char truncation).
