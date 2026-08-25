---
run: xs6yqksx
item: 9x1w62ms
role: dev
created: 2026-08-25T02:51:51Z
---
# Task — engine-core (item 9x1w62ms), build-review/implement, drive run ekq4swkd

## Scope (journal note rv37cbgr)

PRD F1.1–F1.4 + F4.2–F4.3 — project scaffold (Vite + TypeScript per
docs/adr/0001-stack.md, bun test wiring, dev/build scripts), then the pure
engine under src/engine/:

- cards + 8-deck shoe, Fisher-Yates over an injectable RNG, cut card ~14
  cards from the end (round in progress finishes, then shoe retires)
- burn procedure: expose first card (seen), burn A=1 / 2–9=face / T-K=10
  face down (unseen; they reduce decks-remaining only)
- exact punto banco tableau: Player draws 0–5 stands 6–7; Banker draw is a
  function of Banker total AND Player third-card value (standard table;
  Banker follows the Player rule when Player stood); naturals 8/9 end the
  round
- settlement: Player/Banker even money; Banker three-card 7 win = dragon →
  Banker bets PUSH; Player three-card 8 win = panda flag; tie pays 8:1 and
  pushes mains; Dragon 7 side bet pays 40:1 on dragon, Panda 8 pays 25:1 on
  panda. No commission.
- seeded mode plumbing: the RNG seam accepts a seed for reproducible shoes

Read PRODUCT.md ("Domain facts" is normative) and docs/prds/ez-baccarat-game.md F1.

## Guidance (materialized, design skipped)

Implement per the scope above. Stack per docs/adr/0001-stack.md: Vite +
TypeScript, no UI framework, engine as PURE modules under src/engine/ with
bun tests. Scaffold the repo first: package.json (scripts: dev=vite,
build="tsc -b && vite build" or plain vite build, test=bun test), vite +
typescript dev deps via bun, index.html + src/main.ts placeholder page
(title + "engine under construction" note) so `bun run dev` serves.
TDD for all engine code — failing test first, never weaken an assertion.
Cover: every tableau cell (player third-card value × banker total),
settlement for every outcome flag, burn arithmetic, cut-card retirement,
deterministic seeded replay.

Then VERIFY BY DRIVING: run the full bun test suite, launch `bun run dev`,
curl the page, and capture a verbatim transcript of the session (script(1)
or tee) to /tmp/engine-core-transcript.txt. Report what changed, where, the
full suite result, and the transcript path.

Write your result to the run directory result.md as your task pointer
instructs. Do NOT commit to git; the host handles commits.
