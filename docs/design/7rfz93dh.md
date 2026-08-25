# UI Design — Table view + app shell (item 7rfz93dh)

Spec for PRD F2 + F4.1 under PRODUCT.md hard constraints 2, 3, 5. Stack is
Vite + TypeScript, **no framework** (ADR-0001): every component below is a
plain module exporting a `mount…` function that builds DOM and returns a
handle. Vocabulary is CONTEXT.md's — Table view, Count panel, Trainer /
Casino mode, Round, Burn procedure, Outcome, dragon, panda.

This document is meant to be implemented in one pass. Every colour, size,
duration and easing is literal. Nothing here is a placeholder.

---

## 1. Palette

Rich green felt under a mahogany rail, warm bone type, gold as the only
metallic. Player is cobalt, Banker is crimson, Tie is jade-cyan (chosen so
it separates from the felt), Dragon 7 is fire-orange, Panda 8 is
black/white/bamboo. No greys except true neutrals inside card faces and
chip edges.

### 1.1 Token block — copy verbatim into `src/styles/tokens.css`

```css
:root {
  /* Felt & surfaces */
  --felt-deep:        #08301F;
  --felt-base:        #0E4630;
  --felt-mid:         #14573C;
  --felt-glow:        #1C6E4C;   /* radial centre of the table */
  --felt-line:        #2E8A63;   /* hairline layout rules on felt */
  --rail-wood:        #4A2B18;
  --rail-wood-hi:     #6E4126;
  --rail-wood-lo:     #2C180C;
  --shell-bg:         #0A1712;   /* page behind the table */
  --panel-bg:         #0F241C;   /* count-panel column */
  --panel-edge:       #1D4737;

  /* Type */
  --ink-bright:       #F6F0E2;
  --ink:              #E3DBC6;
  --ink-muted:        #9DB4A8;
  --ink-dim:          #6E877C;
  --ink-on-light:     #14171A;

  /* Metallic accent */
  --gold:             #E8B84B;
  --gold-hi:          #F9DE97;
  --gold-lo:          #A97F1E;
  --gold-glass:       rgba(232, 184, 75, 0.18);

  /* Sides */
  --player:           #3D82DC;
  --player-deep:      #17407E;
  --player-glow:      #96C4FF;
  --banker:           #C93B4C;
  --banker-deep:      #7C1B27;
  --banker-glow:      #FF97A4;
  --tie:              #1FB6A6;
  --tie-deep:         #0C6A61;
  --tie-glow:         #8CF0E5;

  /* Side bets */
  --dragon:           #FF5A2D;
  --dragon-deep:      #8C2A0E;
  --dragon-glow:      #FFB067;
  --dragon-flame-1:   #FFE08A;
  --dragon-flame-2:   #FF8A32;
  --dragon-flame-3:   #C21F1F;
  --panda-ink:        #14171A;
  --panda-white:      #F7F7F2;
  --panda-bamboo:     #63C97C;
  --panda-bamboo-lo:  #24713F;
  --panda-glow:       #C6F3D2;

  /* Cards */
  --card-face:        #FCFAF4;
  --card-face-edge:   #DCD4C2;
  --card-pip-black:   #1B1B1F;
  --card-pip-red:     #C42B34;
  --card-back:        #6E1622;
  --card-back-deep:   #400C14;
  --card-back-gold:   #D4AF57;
  --card-back-rim:    #F2E2B6;
  --card-shadow:      rgba(0, 0, 0, 0.45);

  /* Chips — tier value : face / edge / text */
  --chip-1-face:      #F2F0E6;  --chip-1-edge:    #BFB9A6;  --chip-1-text: #14171A;
  --chip-5-face:      #D2373F;  --chip-5-edge:    #8A1B22;  --chip-5-text: #FFF4F2;
  --chip-25-face:     #16794F;  --chip-25-edge:   #0B4B30;  --chip-25-text: #EAFBF2;
  --chip-100-face:    #191C22;  --chip-100-edge:  #454B57;  --chip-100-text: #F3EFE2;
  --chip-500-face:    #6D3BA8;  --chip-500-edge:  #3F2064;  --chip-500-text: #F4ECFF;
  --chip-1000-face:   #E8B84B;  --chip-1000-edge: #A97F1E;  --chip-1000-text: #2A1D02;

  /* Signals & states */
  --win:              #37D693;
  --lose:             #B4444F;
  --push:             #C9A64A;
  --focus-ring:       #F9DE97;
  --danger:           #E8613F;

  /* Geometry */
  --rail-radius:      28px;
  --spot-radius:      18px;
  --card-w:           92px;
  --card-h:           132px;
  --card-radius:      8px;
  --chip-d:           56px;
  --panel-w:          380px;
  --header-h:         56px;

  /* Shadows */
  --shadow-table:     0 26px 60px rgba(0,0,0,0.55);
  --shadow-card:      0 6px 14px var(--card-shadow);
  --shadow-chip:      0 3px 6px rgba(0,0,0,0.45), inset 0 -2px 0 rgba(0,0,0,0.25);
}
```

### 1.2 Composite surfaces

- **Felt**: `radial-gradient(ellipse 120% 90% at 50% 38%, var(--felt-glow) 0%, var(--felt-mid) 38%, var(--felt-base) 68%, var(--felt-deep) 100%)`. Overlay a 3px repeating noise via a 1×1 inline SVG `feTurbulence` data-URI at `opacity: .05` for cloth grain — no image files.
- **Rail**: 22px border around the felt, `linear-gradient(180deg, var(--rail-wood-hi), var(--rail-wood) 45%, var(--rail-wood-lo))`, `border-radius: var(--rail-radius)`, plus a 2px inset `var(--gold-lo)` hairline between rail and felt.
- **Card back**: `linear-gradient(135deg, var(--card-back) 0%, var(--card-back-deep) 100%)` with a 6px inset border `var(--card-back-rim)` and a repeating 45° lattice `repeating-linear-gradient(45deg, transparent 0 6px, var(--card-back-gold) 6px 7px)` at `opacity: .35`.
- **Chip**: circle, `var(--chip-N-face)` fill, 4px dashed `var(--chip-N-edge)` ring inset 4px (the classic edge spots), value text centred in `var(--chip-N-text)` at 700/15px.

### 1.3 Contrast floor

Every text token on its intended surface clears 4.5:1. `--ink-muted` is the
floor for secondary type on felt; never put `--ink-dim` on `--felt-glow`.

---

## 2. Layout

### 2.1 App shell

```
#app  (grid, 100dvh, background var(--shell-bg))
├── #app-header      height var(--header-h)
├── #app-main        grid-template-columns: minmax(0,1fr) var(--panel-w)
│   ├── #table-view  (this item)
│   └── #panel-slot  (reserved — the Count panel's region, item 4tf7cfvg)
└── #app-status      height 28px, aria-live region + seed/shoe readout
```

`#app-main { display:grid; column-gap:16px; padding:16px; }`

**Casino mode** sets `--panel-w: 0px` on `#app` and `#panel-slot { visibility:hidden }`.
Column width transitions with `--anim-panel` (§3.13); the table re-centres,
it does not resize its card geometry.

**Header contents**, left to right: wordmark `EZ BACCARAT` (gold, 18px, 0.14em
tracking) · shoe meter (`cards remaining / 416` with a 120×6px gold-filled
bar) · seed chip (`SEED a3f9` or `RANDOM`, monospace 12px) · `New Shoe`
button · `Trainer / Casino` segmented toggle · `?` help button.

### 2.2 Table view

`#table-view` is the rail-framed felt, `max-width: 1180px`, `margin-inline:auto`,
`aspect-ratio` unconstrained, internal grid:

```
grid-template-rows:
  [shoe]    104px
  [hands]   minmax(228px, 1fr)
  [bets]    212px
  [tray]    104px;
position: relative;   /* banner + celebration overlays live here */
```

**Row 1 — shoe row.** Shoe box docked right at `justify-self:end`, 132×88px,
mahogany-toned, with a visible card-edge stack on its left face; this is the
origin point of `--anim-deal`. Discard tray docked left, 132×88px, showing a
stacked count. Between them, centred: the burn readout slot (empty except
during §3.9).

**Row 2 — hand zones.** Two zones split by a 132px centre gutter.

- `#hand-player` left, `#hand-banker` right. Each: label (PLAYER / BANKER,
  13px, 0.18em tracking, `--player` / `--banker`), a card row that lays out
  up to three cards left-to-right with `gap: 12px`, and a **total disc**
  (56px circle, 2px border of the side colour, 24px numeral) pinned to the
  outer edge.
- Cards are `var(--card-w) × var(--card-h)`; the third card sits rotated
  `90deg` and offset per casino convention — `transform: rotate(90deg) translate(6px, -4px)`.
- Centre gutter holds the `VS`-less divider: a 1px `--felt-line` vertical
  rule at 40% opacity plus the round number (`#12`, `--ink-dim`, 12px).

**Row 3 — bet spots.** Five spots on a shallow arc, left→right, mirroring
the hand zones so each side bet sits under its side:

| Spot | Size | Shape | Colour | Payout label |
|------|------|-------|--------|--------------|
| PANDA 8 | 152×96 | 12px-radius, 2px `--panda-white` border, fill `rgba(20,23,26,.55)` | `--panda-bamboo` accent bar | `25:1` |
| PLAYER | 208×112 | `--spot-radius`, 2px `--player` border, fill `rgba(23,64,126,.38)` | `--player` | `1:1` |
| TIE | 168×96 | pill (`border-radius:48px`), 2px `--tie`, fill `rgba(12,106,97,.38)` | `--tie` | `8:1` |
| BANKER | 208×112 | `--spot-radius`, 2px `--banker` border, fill `rgba(124,27,39,.38)` | `--banker` | `1:1` |
| DRAGON 7 | 152×96 | 12px-radius, 2px `--dragon`, fill `rgba(140,42,14,.42)` | `--dragon` | `40:1` |

Arc offsets (translateY): Panda `+14px`, Player `0`, Tie `+22px`,
Banker `0`, Dragon `+14px`. Gap `20px`.

Each spot renders: name (13px, 0.16em tracking), payout label (11px,
`--ink-muted`), a **chip stack well** (centred, 72px tall) and a **wager
readout** (`$150`, 15px, `--gold`). Hover/focus lifts the border to 3px and
adds `box-shadow: 0 0 0 4px <colour>26`. The Banker spot carries a small
`DRAGON PUSHES` footnote in 10px `--ink-dim` — hard constraint 1's rule made
visible.

**Row 4 — tray row.** Left: bankroll block — `BANKROLL` label + value in
24px `--gold-hi`, with `--anim-total-tick` on change. Centre: chip tray, six
chips (1 / 5 / 25 / 100 / 500 / 1000) in a row, `--chip-d` each, overlapping
by 8px; the selected chip is raised 10px with a `--focus-ring` halo. Right:
action cluster — `Clear` (ghost), `Rebet` (ghost), `2x` (ghost, 72px), `DEAL` (primary, 148×48,
gold gradient `linear-gradient(180deg, var(--gold-hi), var(--gold))`, ink
`--ink-on-light`, disabled at 38% opacity when total wager is 0 or a round
is animating).

**Overlays** (absolutely positioned inside `#table-view`, `pointer-events:none`):

- `#outcome-banner` — centred on the hands row, `min-width: 420px`, 88px tall,
  glassy fill `rgba(8,48,31,.82)` + 1px `--gold-lo` border, 44px letterspaced
  title. Text and accent per outcome: `PLAYER` (`--player-glow`), `BANKER`
  (`--banker-glow`), `TIE` (`--tie-glow`), `DRAGON!` (fire gradient text),
  `PANDA!` (`--panda-white` on `--panda-ink` with a `--panda-bamboo` rule).
  Second line, 14px `--ink-muted`: totals and net, e.g. `Banker 7 · Player 5 · +$285`.
- `#celebration-layer` — full-bleed, holds §3.7/§3.8 particles only.
- `#burn-layer` — full-bleed, used only by §3.9.

### 2.3 Count panel seam (item 4tf7cfvg)

The Count panel is a **sibling item**. This item ships the region and the
contract; it must not implement panel internals.

- **Region**: `#panel-slot` — grid column 2 of `#app-main`, width
  `var(--panel-w)` (380px), full height, `background: var(--panel-bg)`,
  `border: 1px solid var(--panel-edge)`, `border-radius: 16px`,
  `overflow: hidden auto`. Ships in this item containing a single
  `<div class="panel-placeholder">Count panel</div>` (`--ink-dim`, centred).
- **Mount contract**: the panel item replaces the placeholder via
  `mountCountPanel(host: HTMLElement, bus: GameBus): CountPanelHandle`.
  Table view never imports count code; the panel never queries table DOM.
- **Event bus** — declared and owned by this item in `src/ui/bus.ts`:

```ts
export type GameEvent =
  | { type: "shoe:opened"; exposedBurnCard: Card; unseenBurnCount: number; cardsRemaining: number }
  | { type: "round:start"; round: number }
  | { type: "card:seen"; card: Card; seat: "player" | "banker"; index: number }  // fired as each card flips face-up, so the panel animates in lockstep with the table
  | { type: "round:settled"; result: RoundResult; cardsRemaining: number }
  | { type: "shoe:retired" }
  | { type: "mode:changed"; mode: "trainer" | "casino" }
  | { type: "bankroll:changed"; bankroll: number; delta: number };

export interface GameBus {
  emit(e: GameEvent): void;
  on<T extends GameEvent["type"]>(type: T, fn: (e: Extract<GameEvent, { type: T }>) => void): () => void;
}
```

`RoundResult` and `Card` are re-exported from `src/engine/` unchanged. The
panel derives every count from `result.seenThisRoundForCounts` plus
`shoe:opened` — it is the engine's data, not a UI recomputation.

- **Tokens**: the panel inherits all of §1.1 from `:root`; it owns nothing
  colour-wise except its own layout. `--win` / `--push` / `--gold` are the
  BET / threshold / heading colours it is expected to reuse.

### 2.4 Responsive

- `≥1240px`: as specced.
- `860–1239px`: `--panel-w: 320px`; `--card-w: 76px`, `--card-h: 108px`;
  bet-spot widths scale to `180 / 132 / 148px`.
- `<860px`: single column. `#panel-slot` becomes a bottom sheet
  (`position:sticky; bottom:0; max-height:46dvh`) with a 32px drag handle;
  the mode toggle collapses/expands it. Table rows shrink to
  `88px / minmax(180px,1fr) / 184px / 92px`.

---

## 3. Animations

All keyframes live in `src/styles/anim.css`; every duration is a CSS custom
property so QA can slow the whole app with one override. Timings are
authored on a 60fps budget: transform + opacity only, no layout-triggering
properties.

```css
:root {
  --dur-deal: 380ms;  --dur-flip: 300ms;  --dur-third: 520ms;
  --dur-chip: 260ms;  --dur-sweep: 520ms; --dur-pay: 420ms;
  --dur-dragon: 1200ms; --dur-panda: 1100ms;
  --dur-burn-expose: 500ms; --dur-burn-hold: 1200ms; --dur-burn-fan: 900ms;
  --dur-banner-in: 320ms; --dur-banner-out: 240ms; --dur-panel: 280ms;
  --ease-deal:  cubic-bezier(.22,.61,.36,1);
  --ease-flip:  cubic-bezier(.45,.05,.55,.95);
  --ease-pop:   cubic-bezier(.34,1.56,.64,1);
  --ease-exit:  cubic-bezier(.4,0,1,1);
  --ease-emph:  cubic-bezier(.16,1,.3,1);
}
```

| # | Name | Trigger | Duration / easing | Spec |
|---|------|---------|-------------------|------|
| 3.1 | `deal-slide` | each dealt card | `--dur-deal` / `--ease-deal`, stagger **140ms** in engine order P,B,P,B | Card element starts at the shoe's box (FLIP technique: measure shoe rect, `transform: translate(dx,dy) rotate(-8deg) scale(.86)` → identity). Ends with a 90ms `--ease-pop` settle of `translateY(-4px)→0`. Shadow grows `0→var(--shadow-card)`. |
| 3.2 | `card-flip` | card reaches its seat | `--dur-flip` / `--ease-flip`, begins at 70% of that card's slide | `.card { transform-style: preserve-3d }`, `rotateY(180deg)`; back face `backface-visibility:hidden`. Peak of the flip adds `filter: brightness(1.25)` for 80ms — the "snap". |
| 3.3 | `third-card-emphasis` | a tableau third card is drawn | `--dur-third` / `--ease-emph` | The third card slides in at 1.12 scale, holds 220ms with a 3px `--gold` outline, then settles to 1.0. Simultaneously the drawing side's total disc runs `--anim-total-tick`, and a 12px caption fades in under the hand for 1400ms naming the rule that fired, e.g. `Banker 4 draws vs Player third 6`. Constraint 1 made watchable. |
| 3.4 | `chip-place` | click / key bet on a spot | `--dur-chip` / `--ease-pop` | Chip flies from the tray to the spot's well along `translate` + `rotate(-14deg)→0`, overshoots to `scale(1.08)` at 70%, settles. Stacking: each chip offsets `-6px` on Y from the one below, max 5 visible then a `×N` badge. On landing, the spot border pulses to 3px for 160ms. Reverse (`chip-lift`, 200ms `--ease-exit`) on shift-click / right-click. |
| 3.5 | `win-sweep` | settlement, losing wagers | `--dur-sweep` / `--ease-exit`, starts 200ms after the banner | Losing stacks slide toward the shoe-side rail with `rotate(6deg)`, fading `1→0` over the last 40%. Pushed wagers (Tie on a main win; Banker on a dragon) instead pulse `--push` twice at 200ms and stay put — the push must never look like a loss. |
| 3.6 | `win-payout` | settlement, winning wagers | `--dur-pay` / `--ease-pop`, 90ms stagger per chip | Payout chips arc from the rail into the winning spot, then the whole stack slides to the bankroll block over 340ms while `--anim-total-tick` rolls the bankroll figure. Winning spot holds a `--win` glow (`box-shadow: 0 0 0 3px var(--win), 0 0 28px -4px var(--win)`) for 900ms. |
| 3.7 | `dragon-burst` | `isDragon` | `--dur-dragon` | Banner text renders with `background: linear-gradient(96deg, var(--dragon-flame-1), var(--dragon-flame-2) 45%, var(--dragon-flame-3))` + `background-clip:text`, animated `background-position` 0→200% over the full duration. 18 ember particles (6–12px, `--dragon-glow`) launch from the Banker hand on randomised arcs, `translateY(0→-180px)` with `opacity 1→0` and `--ease-exit`. The felt runs a single `0→.35→0` radial `--dragon` wash over 700ms. The Dragon 7 spot scales `1→1.14→1` on `--ease-pop`. |
| 3.8 | `panda-burst` | `isPanda` | `--dur-panda` | Banner flips to the panda palette (`--panda-ink` plate, `--panda-white` type, `--panda-bamboo` underline that wipes left→right over 420ms). 14 bamboo-leaf shards (CSS-clipped rhombi, `--panda-bamboo`) spin out of the Player hand, `rotate(0→220deg)` + rise 150px, fading over the last 35%. The Panda 8 spot scales `1→1.14→1`. Distinctly *lighter and bouncier* than dragon: `--ease-pop` throughout, no felt wash. |
| 3.9 | `burn-ritual` | new shoe (F4.1) | 500 + 1200 + 900 = **2600ms** total | Phase A `burn-expose` (`--dur-burn-expose`, `--ease-deal`): one card slides from the shoe to the centre of the shoe row and flips face-up at 1.25 scale. Phase B `burn-callout` (`--dur-burn-hold`): a gold-ruled caption appears beneath it — `BURN CARD · 8 · burning 8 cards`; the exposed card gets a `--gold` 3px ring and the status line announces the same string; the `card:seen`-equivalent data reaches the Count panel via `shoe:opened`. Phase C `burn-fan` (`--dur-burn-fan`, `--ease-exit`): N face-down cards fan from the shoe to the discard tray, 40ms stagger, each `rotate(±5deg)` and fading to 0 on arrival; they are visibly **face-down and uncounted** — the panel shows no tag for them. |
| 3.10 | `banner-in` / `banner-out` | settlement / next deal | `--dur-banner-in` `--ease-pop` / `--dur-banner-out` `--ease-exit` | In: `translateY(18px) scale(.94) opacity 0` → identity. Out: fade + `translateY(-10px)`. Auto-dismiss after 2600ms or on the next `DEAL` / `Esc`. |
| 3.11 | `total-tick` | any numeric change (totals, bankroll, wager) | 300ms linear | `requestAnimationFrame` count-up between old and new value with an `ease-out` progress curve; the element also runs `translateY(-3px)→0` and flashes `--gold-hi` for 140ms. |
| 3.12 | `shoe-shake` | new shoe requested | 420ms `--ease-pop` | Shoe box does `translateX(0,-5px,4px,-3px,0)` while the shoe meter refills 0→100% — the only thing that plays before `burn-ritual`. |
| 3.13 | `panel-slide` | Trainer ⇄ Casino | `--dur-panel` / `--ease-emph` | `--panel-w` transitions 380px⇄0 and `#panel-slot` fades `1⇄0` with `translateX(0⇄24px)`. On mobile it is a sheet translate instead. |

**Sequencing.** One `RoundTimeline` (§4) owns the whole round as an ordered
promise chain: `deal-slide`×4 (staggered) → `card-flip`×4 → optional
`third-card-emphasis`×(0–2, Player before Banker) → `banner-in` (+
`dragon-burst` / `panda-burst`) → `win-sweep` ∥ `win-payout`. Total for a
no-draw round ≈ 1.5s, for a two-draw dragon round ≈ 3.4s. Input is locked
for the duration; `Esc` or a second `DEAL` press fast-forwards by setting
`--speed-scale: 0.25` on `#table-view` for the remainder.

**Reduced motion.** `@media (prefers-reduced-motion: reduce)`: set every
`--dur-*` to `1ms` except `--dur-banner-in`/`--dur-burn-hold` (kept at 200ms
/ 1200ms so outcomes and the burn callout remain readable), drop all
particle layers (`#celebration-layer { display:none }`), and replace the
bursts with a 200ms border-colour flash on the winning spot. The game stays
fully playable and every state is still announced.

---

## 4. Component inventory

Plain-TS modules under `src/ui/`. Each exports `mountX(host, deps)` returning
a handle with the listed methods; no classes required, no framework, no
innerHTML for user-derived strings (all text via `textContent`).

| Module | Responsibility | DOM shape hint | Handle |
|--------|----------------|----------------|--------|
| `ui/bus.ts` | Typed pub/sub, the Count-panel seam (§2.3) | none | `createBus(): GameBus` |
| `ui/shell.ts` | Builds `#app`, header, `#app-main`, `#panel-slot`, `#app-status`; owns mode state + `--panel-w` | `<div id="app"><header id="app-header">…</header><div id="app-main">…</div><div id="app-status" role="status" aria-live="polite"></div></div>` | `setMode`, `setSeedLabel`, `announce(text)` |
| `ui/table-view.ts` | Composes the four table rows + overlays; the only module that talks to the engine | `<section id="table-view" class="felt">` with `#row-shoe #row-hands #row-bets #row-tray` + `#outcome-banner #celebration-layer #burn-layer` | `mount`, `destroy` |
| `ui/card-el.ts` | One card: face/back faces, rank+suit glyphs, flip state | `<div class="card" data-rank="7"><div class="card-inner"><div class="card-face">…</div><div class="card-back"></div></div></div>` | `create(card, seat)`, `flip()`, `setRotated()` |
| `ui/hand-zone.ts` | One seat's label, card row, total disc | `<div class="hand" data-seat="player"><span class="hand-label">PLAYER</span><div class="hand-cards"></div><div class="hand-total">0</div></div>` | `addCard`, `setTotal`, `clear`, `emphasizeThird` |
| `ui/shoe-box.ts` | Shoe + discard tray visuals, deal origin rect, `shoe-shake` | `<div class="shoe" aria-hidden="true"><div class="shoe-mouth"></div></div>` + `<div class="discard">` | `originRect()`, `shake()`, `setRemaining` |
| `ui/burn-ritual.ts` | The F4.1 sequence (§3.9) incl. the spoken callout | uses `#burn-layer`; caption `<p class="burn-callout">` | `run(exposedCard, burnCount): Promise<void>` |
| `ui/bet-spot.ts` | One wager area: chips, wager total, hover/focus/win/push states | `<button class="spot" data-bet="dragon" aria-label="Dragon 7, pays 40 to 1"><span class="spot-name">DRAGON 7</span><span class="spot-odds">40:1</span><div class="spot-well"></div><span class="spot-wager">$0</span></button>` | `add(amount)`, `removeLast()`, `clear()`, `settle(state)` |
| `ui/bet-layout.ts` | The five spots on the arc; total-wager accounting; validation against bankroll | `<div id="row-bets" role="group" aria-label="Bets">` | `wagers()`, `clearAll()`, `rebet()`, `lock(bool)` |
| `ui/chip-tray.ts` | Six denominations, selection, flight source rect | `<div class="tray" role="radiogroup"><button class="chip" data-value="25" role="radio">25</button>…</div>` | `selected()`, `select(v)`, `originRect()` |
| `ui/bankroll.ts` | Bankroll display, `total-tick`, localStorage persistence (`ezbac.bankroll`) | `<div class="bankroll"><span class="label">BANKROLL</span><span class="value">$1,000</span></div>` | `get`, `apply(delta)`, `reset()` |
| `ui/outcome-banner.ts` | Banner copy per outcome incl. DRAGON!/PANDA! variants | `<div id="outcome-banner" role="status"><h2></h2><p></p></div>` | `show(settlement, net)`, `hide()` |
| `ui/celebration.ts` | Ember + bamboo particle emitters | fills `#celebration-layer` with `<span class="ember">` / `<span class="leaf">` | `dragon(fromRect)`, `panda(fromRect)` |
| `ui/round-timeline.ts` | The §3 sequencer: ordered promises, input lock, fast-forward | none | `play(result): Promise<void>`, `fastForward()` |
| `ui/keyboard.ts` | Global key map (§5), guards while locked | `document` listener | `attach(handlers)`, `detach()` |
| `ui/controls.ts` | DEAL / Clear / Rebet / 2x / New Shoe / mode toggle buttons + disabled logic | `<div class="actions">` | `setDealEnabled`, `setBusy` |
| `ui/game.ts` | Wiring only: owns `EngineState`, calls `dealRound`, feeds `RoundTimeline`, emits bus events, applies settlement to bankroll | none | `newShoe(seed?)`, `deal()`, `mode` |
| `ui/seed.ts` | Reads `?seed=` (F4.2), formats the header seed chip, exposes seed to `newShoe` | none | `fromLocation(): string \| undefined` |

**Settlement → bankroll rule** (matches the engine's signed-net convention):
each wager's delta is `wager × payout` where `payout` comes from
`settlement.mainPayouts` / `settlement.sidePayouts`; `-1` is a full loss,
`0` is a push, positives are net win. UI never re-derives outcomes.

**Suits.** The engine's `Card` has no suit (`card.ts`), so `card-el.ts`
derives a display suit deterministically from `card.id` —
`SUITS[card.id % 4]` — purely cosmetic and never fed back into game logic.

---

## 5. Interaction

### 5.1 Mouse

- **Click a chip** in the tray → selects that denomination (persisted to
  `ezbac.chip`).
- **Click a bet spot** → places the selected chip; blocked (with a 160ms
  `--danger` border shake) if it would exceed the bankroll.
- **Shift-click / right-click a spot** → removes the top chip (`chip-lift`).
  Right-click calls `preventDefault()`.
- **Click DEAL** → plays the round. **Clear** empties all spots, **Rebet**
  restores the previous round's wagers if affordable.
- **Click New Shoe** → confirm dialog only when the current shoe is not
  retired; then `shoe-shake` → `burn-ritual`.
- Clicking anywhere during an animating round fast-forwards it.

### 5.2 Keyboard (hard constraint 5 — fully playable without a mouse)

| Key | Action |
|-----|--------|
| `P` | bet Player |
| `B` | bet Banker |
| `T` | bet Tie |
| `7` | bet Dragon 7 |
| `8` | bet Panda 8 |
| `1` `2` `3` `4` `5` `6` | select chip 1 / 5 / 25 / 100 / 500 / 1000 |
| `Space` or `Enter` | DEAL (or fast-forward a running round) |
| `Backspace` | remove last chip from the last-touched spot |
| `C` | clear all bets |
| `R` | rebet previous wagers |
| `X` | double the current wagers, or the last ones when the felt is empty |
| `S` | new shoe (confirms if the shoe is live) |
| `M` | toggle Trainer / Casino mode |
| `?` | open the count-rules / help overlay (panel item owns its content) |
| `Esc` | dismiss banner or overlay; cancels the New Shoe confirm |
| `Tab` / `Shift+Tab` | focus order: chip tray → Panda 8 → Player → Tie → Banker → Dragon 7 → Clear → Rebet → 2x → DEAL → header controls |

Modifier-bearing presses (`Ctrl`/`Meta`/`Alt`) are ignored, as are presses
while focus is inside an `<input>`. All keys are no-ops while a round is
animating except `Space`/`Enter`/`Esc`.

### 5.3 Accessibility

- Bet spots are real `<button>`s with `aria-pressed`-free, descriptive
  `aria-label`s including current wager (`"Player, pays 1 to 1, 150 wagered"`),
  refreshed on every change.
- `#app-status` is `role="status" aria-live="polite"` and receives one
  sentence per beat: each dealt card, each third-card rule, the burn callout,
  and the settlement (`"Banker 7 with three cards — Dragon. Banker pushes,
  Dragon 7 pays 40 to 1. Net plus 285."`).
- Focus ring is `outline: 3px solid var(--focus-ring); outline-offset: 3px`
  everywhere; never removed.
- Colour is never the sole signal: wins carry a `✓` glyph, losses a strike
  through the wager, pushes the word `PUSH`.

---

## 6. Implementation order (one pass)

1. `tokens.css` + `anim.css` + `shell.ts` (with `#panel-slot` placeholder).
2. `card-el.ts`, `hand-zone.ts`, `shoe-box.ts` — static render first.
3. `bet-spot.ts`, `bet-layout.ts`, `chip-tray.ts`, `bankroll.ts`.
4. `bus.ts`, `game.ts` wiring to `createEngine` / `dealRound`.
5. `round-timeline.ts` + animations 3.1–3.6, 3.10–3.12.
6. `outcome-banner.ts`, `celebration.ts` (3.7, 3.8).
7. `burn-ritual.ts` (3.9), `seed.ts`, `keyboard.ts`, reduced-motion block.
