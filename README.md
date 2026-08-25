# EZ Baccarat

A self-contained, play-chip **EZ Baccarat** game and counting trainer for the
Dragon 7 and Panda 8 side bets. Play complete eight-deck shoes with standard
punto banco drawing rules, the casino burn procedure, no commission, and the
EZ Baccarat Banker-7 push rule. The table animates deals and outcomes while
the trainer explains each count movement card by card.

## Play

[Play in your browser](https://visualjc.github.io/ez-baccarat/)

Or run it locally with [Bun](https://bun.sh/):

```sh
bun install
bun run dev
```

The published site is built from `main` and pushed to the `gh-pages` branch by
`scripts/deploy-pages.sh`, which GitHub Pages serves. Deploying from a branch
rather than from Actions keeps the parked workflow at `docs/deploy/pages.yml`
optional: this repo's push credential has `repo` but not `workflow` scope.

## Count systems

The trainer keeps a running count and a true count (running count divided by
decks remaining) for each side bet. The tag values and thresholds use the
[Wizard of Odds simplified counting systems](https://wizardofodds.com/games/baccarat/dragon-bet/).

| Side bet | Tags | Bet when true count is | At that threshold |
| --- | --- | --- | --- |
| Dragon 7 | 4, 5, 6, 7 = −1; 8, 9 = +2; all other ranks = 0 | ≥ +4 | about 8% player edge, on about 9.2% of hands |
| Panda 8 | A, 2, T, J, Q, K = +1; 3, 4, 5, 8 = −2; 6, 7 = −1; 9 = +4 | ≥ +11 | about 6.3% player edge, on about 4.6% of hands |

Dragon 7 pays 40:1 for a winning three-card Banker 7; Panda 8 pays 25:1 for
a winning three-card Player 8. The exposed burn card updates both counts;
face-down burns remain unseen and are not counted.

## Trainer and casino modes

**Trainer mode** is the default: its count panel always shows running and true
counts, thresholds, bet signals, and the last round's per-card explanation.
Switch to **casino mode** to hide the panel for a self-test, then toggle it
back whenever you want to check your work.

## Repeatable shoes

Append a seed to the URL to replay the same shuffled shoe and compare your
counting decisions with someone else:

```
?seed=dragon-drill-01
```

## Built through role-routed agents

This project was built by role-routed agents through Nahel playbooks:
Codex **gpt-5.3-codex-spark** implemented, Codex **gpt-5.6-terra** and Claude
**Sonnet** reviewed, Codex **gpt-5.6-sol** ran QA, Claude **Opus** designed
the UI, and an orchestrating agent held final judgment. See
[ADR-0003](docs/adr/0003-per-role-dispatch.md) for the routing decision.
