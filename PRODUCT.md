# EZ Baccarat — Product Constitution

> This is the constitution: human-owned, immutable without the maintainer's explicit sign-off, in every governance mode. Agents may propose amendments as observations; they may never edit this file autonomously. (Hands-off founding: the quoted Goal paragraph is the signed content; the elaboration around it was written by the founding workflow itself, as `nahel/workflows/inception.md` instructs.)

## Goal

> Build an EZ Baccarat web game that is genuinely fun to play — nice colors, satisfying animations — and that doubles as a Dragon 7 and Panda 8 counting trainer: it plays full EZ Baccarat shoes (standard drawing rules, no commission, Dragon 7 pays 40:1 on a winning three-card Banker 7, Panda 8 pays 25:1 on a winning three-card Player 8, casino burn procedure with the first card exposed), and beside the table it keeps both side-bet counts live — the count rules, the running and true counts, and a per-round explanation of why each count moved and when the bet is worth taking. Development is dispatched per role: codex gpt-5.3-codex-spark writes all code including bug fixes, codex gpt-5.6-terra (medium) and claude sonnet review, codex gpt-5.6-sol (medium) runs QA, claude opus designs the UI, and the orchestrating agent holds the judgment. This paragraph was given by Jim in chat on 2026-08-24 and recorded by his delegated agent.

The quoted paragraph is the human's signed content, and the only signed
content in this document (recorded as `founding.paragraph` in `nahel/config`).

## Domain facts

UNCONFIRMED — drafted by an agent from the paragraph and journaled research
(event y10hdeh5); not human-signed.

- EZ Baccarat plays standard punto banco drawing rules from an 8-deck shoe,
  with no commission on winning Banker bets; the compensating rule is that a
  winning three-card Banker total of 7 PUSHES the Banker bet (the "Dragon"
  hand).
- Dragon 7 side bet: pays 40:1 when the Banker wins with a three-card 7;
  house edge 7.611% off the top (Wizard of Odds).
- Panda 8 side bet: pays 25:1 when the Player wins with a three-card 8;
  house edge 10.19% off the top.
- Dragon 7 count (WoO simplified system): 4, 5, 6, 7 → −1; 8, 9 → +2;
  A, 2, 3, T, J, Q, K → 0. Bet when the TRUE count (running ÷ decks
  remaining) is ≥ +4; player edge then ≈ 8%, on ~9.2% of hands.
- Panda 8 count (WoO): T, J, Q, K → +1; A → +1; 2 → +1; 3, 4, 5, 8 → −2;
  6, 7 → −1; 9 → +4. Bet when the true count is ≥ +11; player edge then
  ≈ 6.3%, on ~4.6% of hands.
- Casino burn procedure: at a fresh shoe the first card is turned face up and
  that many cards (A=1, 2–9=face value, T/J/Q/K=10) are burned face down.
  The EXPOSED card updates both counts; the face-down burns are unseen and
  never counted (mathematically identical to cards behind the cut card).
- Tie: pays 8:1 and pushes Player/Banker wagers; the standard baccarat
  tableau decides third-card draws for both sides.

## Hard constraints

UNCONFIRMED — drafted by an agent from the paragraph; not human-signed.

1. Game math is exact and deterministic: the tableau, payouts, shoe
   composition, burn procedure, and both count systems implement the domain
   facts above precisely — no simplified or approximate rules ship.
2. The count aid always shows WHY: every round lists the newly exposed cards
   with their tag values and the resulting running/true count deltas for both
   counts, plus whether each side bet is currently worth taking and at what
   threshold.
3. The game is a self-contained client-side web app: no backend, no network
   calls at play time, no accounts, no real-money anything — this is a game
   and a trainer, never a gambling service.
4. Per-role dispatch is honored: implementation (including bug fixes) routes
   to codex gpt-5.3-codex-spark, review to codex gpt-5.6-terra (medium
   effort) and claude sonnet, QA to codex gpt-5.6-sol (medium), UI design to
   claude opus. The orchestrating host holds judgment and never writes
   feature code itself except through the recorded self-fallback rules
   (nahel/workflows/playbook-run.md section 5).
5. Fun is a requirement, not decoration: card dealing, reveals, and wins are
   animated; the table uses a deliberate color palette from the UI design
   step; the app is playable entirely with mouse or keyboard.
6. Quality invariants of the nahel workflows apply: TDD for game-math code,
   verify-by-driving before any PR, honest journaling of every step.

## Non-goals

UNCONFIRMED — drafted by an agent from the paragraph; not human-signed.

- No real-money play, no wallet, no odds marketing — the bankroll is play
  chips only.
- No multiplayer, no server, no persistence beyond local browser storage.
- No other side bets or baccarat variants (no commission-baccarat toggle, no
  Lucky 6) in this founding's scope.
- No mobile-native builds; a responsive web page is the deliverable.

Amendment note (hands-off founding): only the quoted paragraph is
human-signed. Everything else in this document is agent elaboration —
AFK work may rely on it as a parkable assumption, never as an
un-overridable rule, and the human promotes any of it into the
constitution later by signing it.

## Governance

```yaml
governance:
  product: delegated    # hands-off founding — the paragraph's author left; product legislation is delegated (inception.md)
  architecture: human   # architecture decisions wait for the human
```

## Change log

Every change to this document is recorded here with the human sign-off that authorized it. Agents never edit this file autonomously: amendments are proposed as observations and applied only with the maintainer's recorded sign-off.

- **2026-08-25** — Skeleton scaffolded by `nahel init`; hands-off elaboration written around Jim's verbatim founding paragraph by his delegated agent per `nahel/workflows/inception.md` (delegation journaled in the nahel repo as event vzpj1m1d).
