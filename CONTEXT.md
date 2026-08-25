# EZ Baccarat — Ubiquitous Language

Glossary of the domain model. Terms here are used exactly and consistently in code, workflows, docs, and conversation. Sharpen a term the moment it wobbles — a wobbling term is a design bug.

## Table

- **Shoe** — the 8-deck (416-card) source of every deal; born shuffled, opened with the burn procedure, retired at the cut card.
- **Burn procedure** — the fresh-shoe opening: the first card is exposed face up, then A=1 / 2–9=face / T-K=10 cards are discarded face down. The exposed card is **seen** (it updates the counts); the face-down burns are **unseen** forever.
- **Round** — one coup: Player and Banker each get two cards, the tableau may draw a third for either, the outcome and side bets settle, the counts update from every card exposed this round.
- **Tableau** — the fixed third-card drawing rules of punto banco. Never a choice; the code implements it as a pure function of the two-card totals.
- **Outcome** — `player | banker | tie`, plus the special flags `dragon` (Banker wins with a three-card 7 — Banker bets PUSH, Dragon 7 pays) and `panda` (Player wins with a three-card 8 — Panda 8 pays).
- **Natural** — an initial two-card total of 8 or 9 for either side; ends the round with no draws.

## Bets

- **Player / Banker bet** — even-money main bets. No commission: a winning Banker bet pays 1:1 EXCEPT on a dragon outcome, where it pushes.
- **Tie bet** — pays 8:1 on a tie; Player/Banker bets push.
- **Dragon 7** — side bet paying 40:1 on the dragon outcome; loses otherwise. House edge 7.611% uncounted.
- **Panda 8** — side bet paying 25:1 on the panda outcome; loses otherwise. House edge 10.19% uncounted.

## Counting

- **Tag** — the per-rank value a seen card adds to a count. Dragon 7 tags: 4,5,6,7→−1; 8,9→+2; else 0. Panda 8 tags: A,2,T,J,Q,K→+1; 3,4,5,8→−2; 6,7→−1; 9→+4.
- **Running count** — the sum of tags of every seen card since the shoe opened (the exposed burn card included; face-down burns excluded). One running count per system.
- **True count** — running count ÷ decks remaining (unseen cards ÷ 52, face-down burns counted as unseen). The betting decision reads this, never the running count.
- **Threshold** — the true count at which a side bet turns profitable: Dragon 7 ≥ +4, Panda 8 ≥ +11.
- **Count explanation** — the per-round trace the trainer shows: each newly seen card with both its tags, the running/true deltas per system, and the resulting bet/no-bet state against each threshold. Hard constraint 2 makes this mandatory, every round.

## App

- **Table view** — the animated play surface: shoe, hands, chips, outcome banner.
- **Count panel** — the always-visible trainer sidebar: both counts (running, true), thresholds, bet signals, and the count explanation for the last round.
- **Trainer mode** — count panel visible (default). **Casino mode** — count panel hidden until toggled, for self-testing.
- **Bankroll** — play chips only; persisted in local storage; never money.
