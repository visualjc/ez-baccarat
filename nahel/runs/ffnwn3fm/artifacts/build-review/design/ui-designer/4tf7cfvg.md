# UI Design — Count panel / the trainer (item 4tf7cfvg)

Spec for PRD **F3** (F3.1–F3.4) under PRODUCT.md hard constraints **1, 2, 3,
5**. Hard constraint 2 is this item's soul: *the panel always shows WHY the
counts moved*. Every number on this panel is engine data — the panel formats,
it never counts.

Docks into the region reserved by `docs/design/7rfz93dh.md` §2.3
(`#panel-slot`), inherits that document's palette verbatim from
`src/styles/tokens.css`, and extends `src/styles/anim.css` with four named
animations that follow its existing vocabulary. Stack is Vite + TypeScript,
no framework (ADR-0001): plain `mount…(host, deps)` modules returning handles.

Vocabulary is CONTEXT.md's — Count panel, Tag, Running count, True count,
Threshold, Count explanation, Trainer / Casino mode, Burn procedure.

This document is meant to be implemented in one pass. Every colour, size,
duration and easing is literal.

---

## 0. Contract deltas (read this first)

The panel cannot satisfy hard constraint 2 against the shipped seam as-is.
Three **additive** changes are required before panel work starts. They are
small, they are the engine's own already-computed data, and they exist
precisely so the UI never does count arithmetic.

### 0.1 Why the shipped seam is insufficient

`7rfz93dh.md` §2.3 says the panel "derives every count from
`result.seenThisRoundForCounts` plus `shoe:opened`". That is a UI
recomputation (forbidden by constraint 1's spirit and by this item's brief),
and it is also **wrong on round 1**: `createEngine` already applies the
exposed burn card to the count state (`engine.ts` → `advanceRoundCountState(…,
[opened.exposedBurnCard], …)`), while `seenThisRoundForCounts` prepends that
same card again on `roundsPlayed === 0`. A panel that folds tags over that
array double-counts the burn card for the whole shoe.

`dealRound` already computes exactly the right object — `advanceRoundCountState`
returns `CountRoundResult { state, trace }` — and then throws the trace away.
Expose it.

### 0.2 Engine delta (`src/engine/counts.ts`)

`CountCardTrace` gains the two cumulative values the per-card "running deltas"
column needs. They are produced inside the existing accumulation loop; no new
math is introduced anywhere.

```ts
export interface CountCardTrace {
  rank: Rank;
  dragonTag: number;
  pandaTag: number;
  dragonRunningAfter: number;   // NEW — running count after this card
  pandaRunningAfter: number;    // NEW — running count after this card
}
```

`traceRoundCards(cards)` becomes
`traceRoundCards(cards, fromDragonRunning, fromPandaRunning)` and emits the
running totals as it walks. `advanceRoundCountState` passes
`before.dragonRunning` / `before.pandaRunning`. Its return type is unchanged.

### 0.3 Engine delta (`src/engine/engine.ts`)

```ts
export interface RoundResult {
  // …unchanged fields…
  counts: CountRoundResult;   // NEW — the F1.6 trace + post-round CountState
}

export interface EngineState {
  // …unchanged fields…
  openingCounts: CountRoundResult;   // NEW — the burn-card trace from createEngine
}
```

`dealRound` already holds `roundCount`; assign it to `result.counts`.
`createEngine` already holds `openingCount`; keep it on the state.
`seenThisRoundForCounts` stays for compatibility but the panel must **never**
read it — mark it `@deprecated for count display; use result.counts`.

### 0.4 Bus delta (`src/ui/bus.ts`)

```ts
| { type: "shoe:opened"; exposedBurnCard: Card; unseenBurnCount: number;
    cardsRemaining: number; openingCounts: CountRoundResult }   // field added
```

`game.ts` passes `state.engine.openingCounts` when it emits `shoe:opened`.
No other event changes. `card:seen` already carries `card`, `seat`, `index` —
that is all the live trace rows need.

### 0.5 Wiring delta (`src/ui/game.ts`)

Four lines:

```ts
const panel = mountCountPanel(shell.panelSlot, bus);       // replaces the placeholder
// inside setMode:      panel.setMode(mode);   (or let the panel subscribe to mode:changed — it does)
// inside the fast-forward paths: panel.fastForward();
// inside destroy():    panel.destroy();
```

`table-view.ts` is untouched: it never imports count code, the panel never
queries table DOM. The bus stays the only seam.

### 0.6 The decks-remaining convention (display note, not a bug)

`CountState.decksRemaining = (416 − seenCount) / 52`. That denominator counts
the face-down burns as **unseen**, matching CONTEXT.md ("face-down burns
counted as unseen") and PRODUCT.md ("mathematically identical to cards behind
the cut card"). It therefore does **not** equal the header's shoe meter, which
shows cards physically left to deal (`416 − nextIndex`). After a fresh shoe
with an exposed 8: header reads `407 / 416`, panel reads `7.98 decks`. A
trainer will read that as a bug unless it is labelled, so §3.4 puts the
explanation on the panel.

---

## 1. Anatomy

`#panel-slot` (shipped: 380px, `--panel-bg`, 1px `--panel-edge`, radius 16px,
`overflow: hidden auto`) receives one child, `#count-panel`.

```
#count-panel  (display:flex; flex-direction:column; gap:14px; padding:16px; min-height:100%)
├── .panel-head            32px   — title + decks-remaining readout
├── .count-block[dragon]  128px   — running / true / signal / threshold meter
├── .count-block[panda]   128px
├── .trace-card           flex:1 1 auto; min-height:196px  — the WHY, per card
├── .delta-summary        auto    — the spelled-from-data sentences
├── .rules-card           auto    — <details>, collapsed by default
└── .panel-foot           20px    — mode hint
```

Nothing in the panel is horizontally scrollable; the trace list scrolls
vertically inside its own card.

### 1.1 Typography

| Role | Family | Size / weight / tracking | Colour |
|------|--------|--------------------------|--------|
| Panel title | body sans | 12px / 700 / 0.16em, uppercase | `--gold` |
| Block name (`DRAGON 7`) | body sans | 13px / 700 / 0.16em, uppercase | side colour (§2.2) |
| True numeral | `ui-monospace, SFMono-Regular, monospace`, `font-variant-numeric: tabular-nums` | 40px / 600 / −0.02em | §2.2 |
| Running / delta | same mono | 13px / 600 | §2.2 |
| Signal pill | body sans | 12px / 800 / 0.14em, uppercase | §2.2 |
| Threshold caption | body sans | 11px / 500 | `--ink-muted` |
| Trace header | body sans | 10px / 700 / 0.14em, uppercase | `--ink-dim` |
| Trace tag / running | mono, tabular | 13px / 600 ; 12px / 500 | §3.2 |
| Summary sentence | body sans | 13px / 500, line-height 1.55 | `--ink` |
| Rules table cell | mono, tabular | 12px / 600 | `--ink-bright` |

All numerals are tabular so the columns do not jitter while `count-tick`
rolls them.

---

## 2. Count blocks (F3.1)

Two identical structures, `data-bet="dragon"` and `data-bet="panda"`, in that
order top-to-bottom — matching the table's left-to-right bet row would put
Panda first, but the Dragon 7 count is the one that signals ~2× as often
(9.2% vs 4.6% of hands), so it takes the top slot where the eye lands.

### 2.1 Geometry

```
.count-block {
  height: 128px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--panel-edge);   /* 2px + side colour when hot */
  position: relative;                    /* ::after holds the hot halo */
  display: grid;
  grid-template-rows: 22px 46px 1fr;
  row-gap: 6px;
}
```

**Row 1 — identity.** Glyph (18px) · name (13px) · payout `40:1` / `25:1`
(11px `--ink-dim`, `margin-left:auto`).
Glyphs are text, never images: Dragon `▲`, Panda `◆` (shape carries the
identity for anyone who cannot separate the two hues).

**Row 2 — numbers.** Three columns, `align-items: baseline`,
`grid-template-columns: auto auto 1fr`, `column-gap: 14px`:

1. `TRUE` label (10px `--ink-dim`, above) + the true count at 40px, one
   decimal, U+2212 for the minus sign (`−3.2`, never `-3.2`).
2. `RUN` label + running count at 13px, always signed (`+7`, `0`, `−4`).
3. `Δ` this round at 13px, right-aligned, signed, coloured by sign (§3.2);
   reads `—` before the first round of a shoe.

**Row 3 — signal.** `grid-template-columns: 104px 1fr`, `align-items:center`,
`column-gap: 10px`:

- the signal pill, `104×26px`, radius 13px, centred text `BET` / `NO BET`;
- right of it, stacked: the threshold meter (§2.3) and the caption.

Caption text is generated, never canned:
`needs true ≥ +4 · 2.1 to go` when off, `true ≥ +4 · +0.4 over` when on.
(`2.1` = `threshold − trueAfter`, one decimal. Display subtraction over engine
values using the engine's own `DRAGON_COUNT_THRESHOLD` /
`PANDA_COUNT_THRESHOLD` constants — no count arithmetic.)

### 2.2 Signal states — exact colours

Colour is never the only signal: the pill word, the `▲`/`◆` glyph, the meter
fill and the `✓`/`·` prefix all change too.

**Dragon 7 — fire-orange family.**

```css
/* rest */
.count-block[data-bet="dragon"] {
  border-color: var(--panel-edge);
  background: linear-gradient(180deg, rgba(140,42,14,.10) 0%, rgba(140,42,14,.04) 100%);
}
.count-block[data-bet="dragon"] .count-true   { color: var(--ink-bright); }
.count-block[data-bet="dragon"] .count-name   { color: var(--dragon-glow); }
.count-block[data-bet="dragon"] .signal-pill  {
  background: rgba(110,135,124,.16);
  color: var(--ink-muted);
  box-shadow: inset 0 0 0 1px rgba(157,180,168,.28);
}

/* hot — BET */
.count-block[data-bet="dragon"][data-signal="on"] {
  border: 2px solid var(--dragon);
  padding: 11px 13px;                      /* keeps the box the same size */
  background: linear-gradient(180deg, rgba(255,90,45,.18) 0%, rgba(140,42,14,.40) 100%);
}
.count-block[data-bet="dragon"][data-signal="on"] .count-true { color: var(--dragon-glow); }
.count-block[data-bet="dragon"][data-signal="on"] .signal-pill {
  background: linear-gradient(180deg, var(--dragon-flame-1) 0%, var(--dragon-flame-2) 55%, var(--dragon-flame-3) 100%);
  color: var(--ink-on-light);
  box-shadow: 0 2px 10px -2px rgba(255,90,45,.75);
}
.count-block[data-bet="dragon"][data-signal="on"]::after {   /* halo layer, opacity-animated */
  content: ""; position: absolute; inset: -1px; border-radius: 14px; pointer-events: none;
  box-shadow: 0 0 26px -6px var(--dragon), inset 0 0 0 1px rgba(255,176,103,.45);
}
```

**Panda 8 — black / white / bamboo.**

```css
/* rest */
.count-block[data-bet="panda"] {
  border-color: var(--panel-edge);
  background: linear-gradient(180deg, rgba(20,23,26,.46) 0%, rgba(20,23,26,.22) 100%);
}
.count-block[data-bet="panda"] .count-name  { color: var(--panda-bamboo); }
.count-block[data-bet="panda"] .count-true  { color: var(--ink-bright); }
.count-block[data-bet="panda"] .signal-pill {
  background: rgba(110,135,124,.16);
  color: var(--ink-muted);
  box-shadow: inset 0 0 0 1px rgba(157,180,168,.28);
}

/* hot — BET */
.count-block[data-bet="panda"][data-signal="on"] {
  border: 2px solid var(--panda-bamboo);
  padding: 11px 13px;
  background: linear-gradient(180deg, rgba(99,201,124,.16) 0%, rgba(36,113,63,.38) 100%);
}
.count-block[data-bet="panda"][data-signal="on"] .count-true { color: var(--panda-glow); }
.count-block[data-bet="panda"][data-signal="on"] .signal-pill {
  background: var(--panda-white);
  color: var(--panda-ink);
  border-left: 4px solid var(--panda-bamboo);
  box-shadow: 0 2px 10px -2px rgba(99,201,124,.55);
}
.count-block[data-bet="panda"][data-signal="on"]::after {
  content: ""; position: absolute; inset: -1px; border-radius: 14px; pointer-events: none;
  box-shadow: 0 0 26px -6px var(--panda-bamboo), inset 0 0 0 1px rgba(198,243,210,.42);
}
```

**Pill text.** `BET` is prefixed `✓ ` when on; `NO BET` is prefixed `· ` when
off, so the two words differ in length *and* in glyph.

**Deviation note.** §2.3 of the table spec expected the panel to reuse `--win`
for BET. It does not: two blocks that both go green are indistinguishable in
peripheral vision, and the whole point of the panel is that the player learns
*which* bet is live. `--win` / `--lose` are still reused, for the signed delta
numerals (§3.2), and `--gold` for headings, exactly as the seam intended.

### 2.3 Threshold meter

A 6px track showing distance to the threshold — how *close* the count is, not
just whether it arrived.

```css
.thresh-track { height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; }
.thresh-fill  { height: 100%; width: 100%; transform-origin: left center;
                transform: scaleX(var(--fill, 0));
                transition: transform 320ms var(--ease-emph); }
```

`--fill` is set from `clamp(0, trueAfter / threshold, 1)` (0 when `trueAfter ≤
0`; 1 when at or over). Fill colour: dragon `linear-gradient(90deg,
var(--dragon-deep), var(--dragon))`, panda `linear-gradient(90deg,
var(--panda-bamboo-lo), var(--panda-bamboo))`. At `data-signal="on"` the fill
switches to the pill's own hot gradient. `scaleX` keeps the animation on the
compositor — no width transitions anywhere in this panel.

### 2.4 Panel head

`.panel-head`: `COUNT TRAINER` (title style) on the left; on the right, the
decks readout — `7.98 decks unseen` in mono 12px `--ink-muted`, with the
number in `--ink-bright`. Value is `counts.state.decksRemaining` formatted to
2 decimals. A `?`-less info affordance is deliberately absent here; §3.4
carries the explanation inline where it is needed.

---

## 3. The trace card — "why the counts moved" (F3.2)

This is the constraint-2 organ. It renders `result.counts.trace` and nothing
else.

### 3.1 Structure

```html
<section class="trace-card" aria-label="Count explanation">
  <header class="trace-head">
    <span>ROUND 12</span><span class="trace-src">6 cards seen</span>
  </header>
  <div class="trace-cols" aria-hidden="true">
    <span>CARD</span><span>D7</span><span>RUN</span><span>P8</span><span>RUN</span>
  </div>
  <ol class="trace-list" role="log" tabindex="19"> … </ol>
</section>
```

`.trace-card`: `background: rgba(8,48,31,.42)`, 1px `--panel-edge`, radius
12px, padding 10px 12px, `display:flex; flex-direction:column; min-height:0`.
`.trace-list`: `flex:1 1 auto; overflow-y:auto; margin:0; padding:0;
list-style:none;` with `scrollbar-width: thin`.
`.trace-cols` is a sticky 18px grid header, `background: inherit`, matching
the row grid below it.

### 3.2 Row

```css
.trace-row {
  height: 34px;
  display: grid;
  grid-template-columns: 28px 34px 60px 44px 60px 44px;
  column-gap: 8px;
  align-items: center;
  border-bottom: 1px solid rgba(46,138,99,.14);
}
```
(28+34+60+44+60+44 + 5×8 = 310px inside the 324px content box at `--panel-w:
380px`.)

| Cell | Content | Style |
|------|---------|-------|
| 1 — rank chip | `7`, `K`, `A` | 28×24px, `background: var(--card-face)`, 1px `--card-face-edge`, radius 5px, `color: var(--card-pip-black)`, 15px/700, centred — a miniature of the table's card face so the row reads as *that card* |
| 2 — seat | `P` / `B` / `BURN` | 10px/700/0.12em, `--ink-dim`; `BURN` is 9px and `--gold` |
| 3 — Dragon tag | `+2` / `−1` / `0` | mono 13px, colour by sign (§3.3) |
| 4 — Dragon running | `→ 6` | mono 12px `--ink-muted`; the arrow is `→` (U+2192) |
| 5 — Panda tag | `+4` / `−2` / `+1` | mono 13px, colour by sign |
| 6 — Panda running | `→ −11` | mono 12px `--ink-muted` |

**Sign colours.** positive `--win` · negative `--lose` · zero `--ink-dim`.
`0` also renders in 500 weight rather than 600, so a zero-tag Dragon row is
visibly inert without relying on hue.

Seat comes from the `card:seen` events of the round, matched positionally to
`trace.cards[i]` — the two sequences are the same list in the same order
(`engine.ts` pushes `seenThisRound` in exactly the emission order). The panel
does not infer seats from card values.

### 3.3 Burn rows (F4.1 / hard constraint 1 made visible)

On `shoe:opened` the trace list is cleared and seeded with two rows built from
`openingCounts`:

- **the exposed burn card** — a normal `.trace-row` with `data-kind="burn"`:
  seat cell reads `BURN`, the rank chip gets `box-shadow: 0 0 0 2px
  var(--gold)`, and the row background is `var(--gold-glass)`. Its tag and
  running cells are real: this card *is* counted.
- **the face-down burns** — one `.trace-row--unseen` spanning the full width:
  `10 cards burned face down · uncounted`, 11px `--ink-dim`, italic, with a
  1px `--ink-dim` dashed top border and `opacity:.72`. Tag cells render `—`,
  not `0`, because the tags are *unknown*, not zero. Count from
  `event.unseenBurnCount`.

### 3.4 Card foot

Under the list, a permanent 11px `--ink-dim` line:
`decks unseen = (416 − seen) ÷ 52 · face-down burns count as unseen`.
This is §0.6's explanation, placed where the discrepancy is noticed.

### 3.5 Empty / retired states

- Fresh shoe, no round yet: the burn rows plus a centred 12px `--ink-dim`
  line, `Deal a round — the explanation lands here.`
- `shoe:retired`: a 26px bar pinned above `.panel-head`, `background:
  var(--gold-glass)`, 1px `--gold-lo`, text `SHOE RETIRED · counts reset on
  the next shoe` (11px `--gold-hi`). Blocks and trace freeze on their last
  values; nothing is zeroed until `shoe:opened` arrives.

---

## 4. Delta summary — spelled from the data (F3.2)

Two sentences per round, one per system, rendered into `.delta-summary`
(`border-left: 3px solid var(--gold)`, `padding: 10px 12px 10px 13px`,
`background: rgba(232,184,75,.06)`, radius 10px, `aria-live="polite"`).

The generator lives in `ui/count-narration.ts` — **pure, DOM-free, unit
tested**. It never selects from a bank of canned strings; every clause is
built from the trace.

### 4.1 Grammar

```
<System> <netSigned>: <leadClauses> [against <opposeClauses>][; <neutralClause>].
True <beforeTrue> → <afterTrue>, <thresholdClause>.
```

**Bucketing.** Group `trace.cards` by tag value for the system. `pos` = buckets
with tag > 0, `neg` = tag < 0, `zero` = tag === 0.

**Which side leads.** Compare `|Σ pos|` and `|Σ neg|`; the larger leads. Tie →
the side matching the sign of the net; net 0 → `neg` leads. Within a side,
buckets sort by descending `|tag|`, then by first appearance.

**Bucket clause.** `${countWord} ${signedTag} card${s} (${ranks})`, ranks in
the order the cards were seen, comma-separated. Count words: one, two, three,
four, five, six, seven, eight, nine, ten, eleven, twelve; ≥13 → the numeral.

**Joining.** Same-side buckets join with ` and `. Sides join with ` against `.
Zero-tag cards never lead or oppose; they append as
`; ${countWord} neutral (${ranks})` and are omitted entirely when empty.

**Net.** `+3`, `−1`, or the word `unchanged` when 0 (`Dragon unchanged: …`).

**Threshold clause**, from `trace.before[sys].signal` → `trace.after[sys].signal`:

| before → after | clause |
|---|---|
| false → true | `crossing +4 — BET NOW` |
| true → false | `back under +4 — bet off` |
| true → true | `still over +4 — keep betting` |
| false → false | `still under +4` |

True counts render to one decimal with U+2212; `−0.0` normalises to `0.0`.

### 4.2 Worked examples

PRD F3.2's own example — a round exposing 5, 5, 4, 8 (true counts shown are
illustrative):

> **Dragon −1:** three −1 cards (5, 5, 4) against one +2 card (8). True 3.4 → 3.2, still under +4.
> **Panda −8:** four −2 cards (5, 5, 4, 8). True 2.1 → 1.9, still under +11.

Note the asymmetry: for Dragon those four cards form two buckets, for Panda a
single one, because **bucketing is by tag value, never by rank**. The Panda
sentence must not read "three −2 cards and one −2 card".

A round of 9, 9, K, 6:

> **Dragon +3:** two +2 cards (9, 9) against one −1 card (6); one neutral (K).
> **Panda +8:** two +4 cards (9, 9) and one +1 card (K) against one −1 card (6).

The count word and the rank list of a bucket are derived from the same array,
so they cannot disagree — `one neutral (K)`, never `two neutral (K)`. The unit
tests assert that agreement for every bucket of every example.

A count that crosses:

> **Dragon +4:** two +2 cards (8, 9). True 3.6 → 4.3, crossing +4 — BET NOW.

The opening burn card, one card only:

> **Dragon unchanged:** one 0 card (A) — no movement. True 0.0 → 0.0, still under +4.

(Net 0 takes the `— no movement` tail instead of a `neutral` clause when
every card in the round is zero-tagged.)

### 4.3 Colour

The system name is the block's name colour (`--dragon-glow` / `--panda-bamboo`),
the signed net takes the sign colours of §3.2, and the threshold clause takes
`--win` when it ends in `BET NOW` or `keep betting`, `--ink-muted` otherwise.
Everything else is `--ink`.

---

## 5. Rules reference card (F3.3)

A native `<details class="rules-card">` — one click away, no JS needed to open.

```html
<details class="rules-card">
  <summary tabindex="18">Count rules &amp; thresholds<span class="chev">▸</span></summary>
  …two tag tables…
</details>
```

- `summary`: 12px/700/0.14em uppercase `--gold`, 34px tall, `cursor:pointer`,
  `list-style:none` (+ `::-webkit-details-marker{display:none}`); the `.chev`
  rotates `0deg → 90deg` over 180ms `--ease-emph` on `[open]`.
- Body padding 10px 12px 12px; two sub-sections, `DRAGON 7` then `PANDA 8`.
- **Tag table**: `display:grid; grid-template-columns: repeat(7, 1fr); gap:4px`.
  Thirteen cells, rank order `A 2 3 4 5 6 7 8 9 T J Q K`. Each cell is 34px
  tall, radius 6px, rank on top (11px `--ink-muted`), tag below (13px mono).
  Cell background by tag sign: positive `rgba(55,214,147,.14)`, negative
  `rgba(180,68,79,.16)`, zero `rgba(157,180,168,.08)`; tag text takes the
  §3.2 sign colours.
- **Values come from the engine**: `DRAGON_TAG_TABLE`, `PANDA_TAG_TABLE`,
  `DRAGON_COUNT_THRESHOLD`, `PANDA_COUNT_THRESHOLD` are imported from
  `src/engine/counts.ts` and rendered by iterating `RANKS`. The tables are
  never retyped in the UI — if the engine's tags change, this card changes
  with them.
- Under each table, one 11px `--ink-muted` line straight from PRODUCT.md's
  domain facts:
  `Bet at true ≥ +4 · player edge ≈ 8% · fires on ≈ 9.2% of hands`
  `Bet at true ≥ +11 · player edge ≈ 6.3% · fires on ≈ 4.6% of hands`
- Open/closed state persists to `localStorage` key `ezbac.rules`, **inside
  `try/catch`** on both read and write (restricted-storage contexts must not
  throw — same guard the bankroll and chip-tray modules already carry).
- `?` (and the header `?` button) dispatch `ezb:help` on `window`, which
  `game.ts` already fires. The panel listens, opens the card, scrolls it into
  view and focuses the `summary`. In Casino mode the same event still opens
  it — the rules are not the answer, so they are never hidden.

---

## 6. Modes and visibility (F3.4)

The shell owns the column (`--panel-w: 380px ⇄ 0px`, `visibility`); the panel
owns what happens to its own contents.

On `mode:changed`:

| → mode | Panel behaviour |
|--------|-----------------|
| `casino` | Keeps subscribing and keeps updating its DOM (so returning shows the *current* count, never a stale one). Sets `inert` and `aria-hidden="true"` on `#count-panel` so it leaves the tab order and the a11y tree; suppresses `count-tick` / `signal-flip` (nothing animates off-screen). |
| `trainer` | Clears `inert`/`aria-hidden`, then runs `count-reveal` (§7.4) on both blocks' numerals and the delta summary — the self-test payoff: you guessed, here is the answer. |

The panel never toggles the mode itself and never writes `--panel-w`.
Announcement on return is left to the shell (`M` already announces); the
panel adds nothing to `#app-status` on mode change, to avoid double speech.

---

## 7. Motion

Four new animations, authored in the vocabulary `src/styles/anim.css` already
uses: every duration is a `--dur-*` custom property, every consumed value is
the `--anim-*` product with `--speed-scale`, transform/opacity only.

### 7.1 Tokens — append to the `:root` block in `anim.css`

```css
  --dur-count-tick: 420ms;
  --dur-signal-out: 160ms;
  --dur-signal-in: 220ms;    /* --dur-signal-out + --dur-signal-in = 380ms flip */
  --dur-trace-row: 260ms;
  --dur-reveal: 420ms;
  --anim-count-tick: calc(var(--dur-count-tick) * var(--speed-scale));
  --anim-signal-out: calc(var(--dur-signal-out) * var(--speed-scale));
  --anim-signal-in:  calc(var(--dur-signal-in)  * var(--speed-scale));
  --anim-trace-row:  calc(var(--dur-trace-row)  * var(--speed-scale));
  --anim-reveal:     calc(var(--dur-reveal)     * var(--speed-scale));
```

### 7.2 Keyframes

```css
@keyframes count-tick-up {
  0%   { transform: translateY(-6px) scale(1.07); color: var(--tick-color); }
  55%  { transform: translateY(0) scale(1); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes count-tick-down {
  0%   { transform: translateY(6px) scale(.94); color: var(--tick-color); }
  55%  { transform: translateY(0) scale(1); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes signal-flip-out { from { transform: rotateX(0deg);   opacity: 1; }
                             to   { transform: rotateX(90deg);  opacity: .35; } }
@keyframes signal-flip-in  { from { transform: rotateX(-90deg); opacity: .35; }
                             to   { transform: rotateX(0deg);   opacity: 1; } }
@keyframes signal-halo     { 0% { opacity: 0; } 38% { opacity: 1; } 100% { opacity: .55; } }
@keyframes trace-row-in    { from { opacity: 0; transform: translateX(14px); }
                             to   { opacity: 1; transform: translateX(0); } }
@keyframes count-reveal    { from { opacity: 0; filter: blur(8px); transform: scale(1.04); }
                             to   { opacity: 1; filter: blur(0);   transform: scale(1); } }
```

### 7.3 Table

| # | Name | Trigger | Duration / easing | Spec |
|---|------|---------|-------------------|------|
| 7.a | `count-tick` | a running or true value changes at `round:settled` | `--anim-count-tick` / `--ease-pop` | The numeral element runs `count-tick-up` when the new value is greater, `count-tick-down` when smaller, nothing when equal. `--tick-color` is set inline per block: `var(--dragon-glow)` / `var(--panda-glow)`. In parallel, JS rolls the digits with `requestAnimationFrame` between the trace's `before` and `after` values over the same duration on an ease-out curve — the same technique as the table's §3.11 `total-tick`, so bankroll and counts feel like one system. Running counts roll as integers; true counts roll to one decimal. Both blocks tick simultaneously (they describe one event), 0ms stagger. |
| 7.b | `signal-flip` | `trace.before[sys].signal !== trace.after[sys].signal` | `--anim-signal-out` `--ease-exit` then `--anim-signal-in` `--ease-pop` | The pill flips on X. At `animationend` of the *out* half, JS swaps the pill's `textContent` and the block's `data-signal`, then starts the *in* half. A 250ms safety `setTimeout` performs the swap if `animationend` never fires (reduced motion, background tab). Turning **on** additionally runs `signal-halo` on `.count-block::after` for 520ms `--ease-emph` and gives the threshold meter its hot gradient. Turning **off** fades the halo out over 220ms `--ease-exit`. Starts 120ms after `count-tick` begins so the number is seen to move *before* the verdict changes — cause, then effect. |
| 7.c | `trace-row-in` | each trace row entering the list | `--anim-trace-row` / `--ease-emph`, **45ms stagger** by row index, `animation-fill-mode: backwards` | Rows enter top-to-bottom in engine order. Provisional rows (§8.2) animate on their `card:seen`, so they land in lockstep with the table's card flips; the reconciliation pass at `round:settled` fills the running cells **without** re-animating existing rows — only rows that were not already present animate. Full round of 6 cards ≈ 260 + 5×45 = 485ms. |
| 7.d | `count-reveal` | Casino → Trainer | `--anim-reveal` / `--ease-emph` | Both true numerals, both running numerals and `.delta-summary` un-blur and settle, 60ms stagger in that order. Only fires on the mode transition, never on a normal round. |
| 7.e | `thresh-fill` | any threshold-meter change | 320ms `--ease-emph` (a `transition`, not a keyframe) | See §2.3 — `transform: scaleX()`. |

### 7.4 Fast-forward

`.speed-fast { --speed-scale: .025 }` is applied by the table timeline to
`#table-view`, which is not an ancestor of the panel. `CountPanelHandle`
therefore exposes `fastForward()`, which adds `.speed-fast` to `#count-panel`
and drops any pending row-stagger delays; `game.ts` calls it from the same
places it calls `table.fastForward()`. The class is removed at the next
`round:start`.

### 7.5 Reduced motion

Add to the existing `@media (prefers-reduced-motion: reduce)` block:

```css
    --dur-count-tick: 1ms; --dur-signal-out: 1ms; --dur-signal-in: 1ms;
    --dur-trace-row: 1ms;  --dur-reveal: 1ms;
```

and `.thresh-fill { transition: none }`. The rAF digit roll is skipped
entirely (values are set directly), the pill text swap still happens via the
safety timeout path, and `signal-halo` renders as a static `opacity:.55`
instead of animating. Every state remains visible; only the motion goes.

---

## 8. Component inventory

Plain-TS modules under `src/ui/`. Each exports `mountX(host, deps)` returning
a handle. No framework, no `innerHTML` — all text via `textContent`.

| Module | Responsibility | Reads from engine | Handle |
|--------|----------------|-------------------|--------|
| `ui/count-panel.ts` | Mounts `#count-panel` into `#panel-slot` (replacing the placeholder), owns every bus subscription, sequences §7 | bus only | `mountCountPanel(host, bus): CountPanelHandle` |
| `ui/count-block.ts` | One side-bet block: identity row, numerals, pill, threshold meter; owns `count-tick` + `signal-flip` | `CountSignal` (`before`/`after`), `CountState.decksRemaining`, `DRAGON_/PANDA_COUNT_THRESHOLD` | `update(before, after, decks)`, `reveal()`, `element` |
| `ui/count-trace.ts` | The trace card: header, sticky column labels, rows, burn rows, empty/retired states | `CountRoundTrace.cards` (rank, both tags, both `…RunningAfter`), `unseenBurnCount` | `beginRound(n)`, `addProvisional(card, seat, index)`, `reconcile(trace)`, `seedBurn(openingCounts, unseenBurnCount)`, `clear()` |
| `ui/count-narration.ts` | **Pure** §4 sentence builder — no DOM, no globals | `CountRoundTrace`, thresholds | `describeRound(trace): { dragon: Clause[]; panda: Clause[] }` |
| `ui/count-summary.ts` | Renders `count-narration`'s clauses with §4.3 colouring into the `aria-live` region | nothing directly | `render(clauses)`, `clear()` |
| `ui/count-rules.ts` | The `<details>` reference card; builds both tag grids by iterating `RANKS` | `DRAGON_TAG_TABLE`, `PANDA_TAG_TABLE`, `RANKS`, both thresholds | `open()`, `toggle()`, `element` |
| `ui/count-format.ts` | Formatting only: `signed(n)`, `trueCount(n)` (1 dp, U+2212), `decks(n)` (2 dp), `countWord(n)`, `rankList(ranks)` | nothing | pure functions |

```ts
export interface CountPanelHandle {
  element: HTMLElement;
  setMode(mode: GameMode): void;
  fastForward(): void;
  openRules(): void;
  destroy(): void;          // unsubscribes every bus listener, removes the element
}
```

### 8.1 Event → panel mapping

| Bus event | Panel action |
|-----------|--------------|
| `shoe:opened` | `trace.clear()`; `trace.seedBurn(openingCounts, unseenBurnCount)`; both blocks `update(openingCounts.trace.before, openingCounts.trace.after, openingCounts.state.decksRemaining)` **without** `count-tick` (a new shoe is a reset, not a move); summary renders the one-card opening sentence (§4.2); retired bar cleared |
| `round:start` | `trace.beginRound(n)`; drops `.speed-fast`; summary shows a 12px `--ink-dim` `counting…` placeholder |
| `card:seen` | `trace.addProvisional(card, seat, index)` — row animates in with tags filled, running cells showing `·` |
| `round:settled` | `trace.reconcile(result.counts.trace)` (authoritative; provisional rows keep their DOM, gain their running values, and any mismatch in length or rank order **replaces the whole list**); blocks `update(trace.before, trace.after, counts.state.decksRemaining)` with §7.a/§7.b; summary renders |
| `shoe:retired` | Retired bar shown (§3.5); blocks and trace freeze |
| `mode:changed` | §6 |
| `bankroll:changed` | ignored |

### 8.2 The one rule

**The panel performs no count arithmetic.** Tags, running counts, true counts,
decks remaining and both signals arrive as engine values. The only numeric
work the panel does is *presentation*: rounding to one/two decimals, the rAF
interpolation between an engine before-value and an engine after-value, the
`threshold − true` distance caption, and `clamp(0, true/threshold, 1)` for the
meter. Provisional rows call the engine's own `dragonTagForRank` /
`pandaTagForRank` — engine functions, not a UI table — and are overwritten by
the authoritative trace at settle.

### 8.3 Tests to ship with it

- `count-narration.test.ts` — the §4.2 examples, bucket merging by tag value,
  count-word/rank-list agreement, all four threshold clauses, the net-0 and
  single-card tails, U+2212 rendering.
- `count-format.test.ts` — `−0.0 → 0.0`, 13+ count words, decks to 2 dp.
- `count-panel.test.ts` (headless DOM) — event mapping of §8.1, the burn
  seeding not double-counting on round 1, `inert` in casino mode, reconcile
  replacing a mismatched provisional list.

---

## 9. Interaction, keyboard, accessibility

### 9.1 Keyboard

The panel adds **no new global keys** — the table spec's map is complete and
`M` / `?` already reach it.

| Key | Panel effect |
|-----|--------------|
| `?` (or the header `?` button) | Opens the rules card, scrolls it into view, focuses its `summary`. Works in both modes. |
| `M` | Mode toggle (shell-owned); the panel reacts per §6. |
| `Tab` / `Shift+Tab` | Panel focus stops come **after** the header controls, continuing the table spec's documented order: … → DEAL → header controls → **rules summary (tabIndex 18) → trace list (tabIndex 19)**. |
| `Enter` / `Space` on the rules summary | Native `<details>` toggle. Note the global handler treats `Space`/`Enter` as DEAL — the panel's `summary` must `stopPropagation()` on those keys while focused, or DEAL fires behind the toggle. |
| `↑` `↓` `PageUp` `PageDown` on the focused trace list | Native scroll (the list is `tabindex="19"`, so it is keyboard-scrollable — a long round plus burn rows exceeds the card). |

`inert` in Casino mode removes both stops from the order automatically.

### 9.2 Accessibility

- `#count-panel` is `role="region" aria-label="Count trainer"`.
- Each block is `role="group"` with `aria-label` regenerated on every update:
  `"Dragon 7 count: running plus 7, true 4.1, bet on, threshold plus 4"`.
  Digits are spelled as words by the label builder so screen readers do not
  read `+7` as "seven".
- `.delta-summary` is the panel's only `aria-live="polite"` region. The
  shell's `#app-status` announces the *outcome*; the summary announces the
  *why*. They are different sentences and fire in sequence — that is the
  non-visual form of hard constraint 2.
- `.trace-list` is `role="log"` with `aria-live="off"`: row-by-row speech
  during dealing would bury the summary. The rows remain readable on demand
  because the list is focusable.
- Contrast: every combination in §2.2 was chosen against its own surface;
  `--ink-on-light` on `--dragon-flame-2`, `--panda-ink` on `--panda-white`,
  `--ink-muted` on `--panel-bg` and `--ink-dim` on `.trace-card`'s
  `rgba(8,48,31,.42)` all clear 4.5:1. `--ink-dim` is never placed on the
  hot gradients.
- Focus ring is the global `outline: 3px solid var(--focus-ring);
  outline-offset: 3px`; never removed.

---

## 10. Responsive

- **≥1240px** — as specified; `--panel-w: 380px`, content box 324px.
- **860–1239px** — `--panel-w: 320px` (already in `app.css`), content box
  264px. Changes: true numeral 34px; block height 118px; trace grid becomes
  `26px 28px 52px 36px 52px 36px` with `column-gap: 6px` (= 256px); the
  `RUN` column labels shorten to `→`; rules tag grid drops to
  `repeat(5, 1fr)`.
- **<860px** — the shell already turns `#panel-slot` into a sticky bottom
  sheet at `max-height: 46dvh`. The panel reorders itself with
  `#count-panel[data-compact="true"]`:
  1. the two count blocks become a 2-column grid, `position: sticky; top: 0`,
     height 96px each (true numeral 30px, threshold caption on one line);
  2. `.delta-summary` moves directly beneath them (the why must survive the
     squeeze before the per-card detail does);
  3. `.trace-card` takes the remaining height with `min-height: 120px`;
  4. `.rules-card` is force-collapsed on entering compact mode (its stored
     open state is preserved for when the viewport grows back).
  A 32px drag handle is the shell's, not the panel's.

---

## 11. Implementation order (one pass)

1. **§0 contract deltas** — `counts.ts` trace fields, `RoundResult.counts`,
   `EngineState.openingCounts`, the `shoe:opened` field, `game.ts` wiring.
   Extend the existing engine count tests to assert the new fields (including
   that round 1 does **not** double-count the burn card).
2. `count-format.ts` + `count-narration.ts` with their tests — pure, no DOM,
   fastest to get right and the highest-risk logic in the item.
3. `count-panel.ts` skeleton + `count-block.ts` static render (no motion):
   real numbers on screen from `round:settled`.
4. `count-trace.ts` static rows, burn seeding, empty/retired states.
5. `count-summary.ts` wiring `count-narration` into the live region.
6. `count-rules.ts` (+ guarded `localStorage`).
7. Motion §7: tokens and keyframes into `anim.css`, then `count-tick`,
   `signal-flip`, `trace-row-in`, `count-reveal`, `fastForward()`, and the
   reduced-motion block.
8. Modes §6, keyboard/a11y §9, responsive §10.

## 12. Acceptance mapping

| PRD | Where |
|-----|-------|
| F3.1 always-current running / true / decks / signal + threshold | §2.1–§2.4 |
| F3.2 per-card trace and a delta summary spelled from the data | §3, §4 |
| F3.3 collapsible rules reference, one click away | §5 |
| F3.4 trainer / casino visibility | §6 |
| Hard constraint 2 (the WHY, every round, both counts, with thresholds) | §3 + §4 + §9.2's live region |
| Hard constraint 5 (fully keyboard playable, animated) | §7, §9.1 |
| QA hand-verification over ≥3 rounds including a burn card | §3.3 burn rows carry real tags; §5's tables are the engine's, so the panel can be checked against itself |
