---
name: ez-baccarat-game
created: 2026-08-25T02:42:06Z
updated: 2026-08-25T02:47:02Z
---

# PRD — EZ Baccarat game + Dragon/Panda counting trainer

One web app, two jobs: play real EZ Baccarat, and teach the two side-bet
counts by showing the arithmetic live. The constitution's Goal paragraph is
the source of truth; PRODUCT.md's domain facts carry the exact rules and
tags; CONTEXT.md carries the vocabulary this document uses without
redefining.

## F1 — Game engine (pure, tested)

- F1.1 Shoe: 416 cards (8 decks), Fisher-Yates shuffle over an injectable
  RNG, cut card at ~14 cards from the end; a round that would cross the cut
  card finishes, then the shoe retires.
- F1.2 Burn procedure: expose the first card, burn A=1 / 2–9=face / T-K=10
  cards face down. The exposed card is seen; the burns are unseen and reduce
  the decks-remaining denominator only.
- F1.3 Tableau: exact punto banco third-card rules — the Player draws on
  0–5 and stands on 6–7; the Banker's draw is a pure function of the
  Banker two-card total AND the value of the Player's third card (the
  standard banker table; Banker follows the Player rule when the Player
  stood). Naturals (8/9 on either side's first two cards) end the round
  before any draw.
- F1.4 Settlement: Player/Banker even money; dragon outcome pushes Banker
  bets and pays Dragon 7 at 40:1; panda outcome pays Panda 8 at 25:1;
  tie pays 8:1 and pushes main bets. No commission anywhere.
- F1.5 Counts: both tag systems from PRODUCT.md, running and true counts
  (true = running ÷ (unseen cards ÷ 52)), bet signals at Dragon ≥ +4 true,
  Panda ≥ +11 true. Every seen card carries both tags; unseen cards carry
  none.
- F1.6 Round trace: the engine emits, per round, the ordered list of seen
  cards with both tag values and both count states before/after — the data
  hard constraint 2 requires the UI to show.
- Acceptance: bun tests cover the tableau exhaustively (all draw/stand
  cells), settlement for every outcome flag, burn arithmetic, count tags per
  rank, true-count division, and a full deterministic shoe replay from a
  seeded RNG.

## F2 — Table view (fun is a hard constraint)

- F2.1 Betting: chips onto Player / Banker / Tie / Dragon 7 / Panda 8;
  keyboard shortcuts for each; bankroll in play chips, persisted to local
  storage.
- F2.2 Deal animation: cards slide from the shoe and flip; the third-card
  draw visibly follows the tableau; outcome banner (PLAYER / BANKER / TIE /
  DRAGON! / PANDA!) with a distinct celebratory animation for dragon and
  panda hits.
- F2.3 Palette and motion come from the design step's spec
  (docs/design/…): deliberate colors, smooth transitions, no placeholder
  gray.
- Acceptance: a played round is watchable — dealing, flipping, settling are
  animated, and QA confirms the animations fire on every path (natural,
  draws, tie, dragon, panda).

## F3 — Count panel (the trainer)

- F3.1 Always-current: both running counts, both true counts, decks
  remaining, and each bet signal (BET / NO BET with the threshold shown).
- F3.2 The why: after every round, the F1.6 trace renders as a per-card
  list — rank, Dragon tag, Panda tag — plus a delta summary SPELLED FROM
  THE DATA, never canned (e.g. a round exposing 5, 5, 4, 8 reads
  "Dragon −1: three minus-one cards (5, 5, 4) against one +2 (the 8)").
- F3.3 Count rules reference: a collapsible card showing both tag tables
  and thresholds, always one click away.
- F3.4 Modes: trainer (panel visible, default) and casino (panel hidden;
  toggling back reveals the counts so players can self-test).
- Acceptance: QA hand-verifies the panel against the tag tables for at
  least three rounds including a burn card.

## F4 — Shell

- F4.1 New-shoe flow: burn animation with the exposed card called out and
  counted in the panel trace.
- F4.2 Seeded mode: a query param or settings toggle fixes the RNG seed for
  reproducible shoes (training and QA both use it).
- F4.3 Static build: `bun run build` emits a self-contained dist/ the
  GitHub Pages workflow can serve; no runtime network.

## Out of scope

Per the constitution's non-goals: no real money, no server, no other side
bets or variants, no native builds.
