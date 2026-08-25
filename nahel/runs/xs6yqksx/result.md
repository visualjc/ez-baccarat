---
run: xs6yqksx
item: 9x1w62ms
status: partial
summary: "Scaffolded Vite+TypeScript with a pure Baccarat engine, added tableau/settlement/shuffle/burn/cut logic tests, but could not execute required Bun verification because `bun` is unavailable."
---

# Task outcome

- Added project scaffold and scripts in `package.json`, `tsconfig.json`, `index.html`, and `src/main.ts`.
- Implemented pure engine modules under `src/engine/`:
  - `card.ts` for 8-deck card composition and rank/value mapping.
  - `rng.ts` for deterministic seeded RNG (`createSeededRng`).
  - `shoe.ts` for shuffle, cut-card boundary, burn accounting, draws, and round-final retirement transitions.
  - `rules.ts` for baccarat tableau decisions and settlement (Player/Banker/Tie, Dragon/Panda flags, payout multipliers).
  - `engine.ts` for dealing rounds from a shoe, seeded initialization, and exposed burn workflow.
- Added extensive tests in `src/engine/engine.test.ts` covering:
  - 8-deck composition counts.
  - seeded Fisher–Yates reproducibility.
  - burn arithmetic and seen/unseen behavior.
  - complete banker-tableau matrix across player third-card value × banker total.
  - settlement for player win/panda, banker dragon, and tie outcomes.
  - seeded replay determinism.
  - cut-card retirement only after a round that crosses it.

## What was run

- `bun test` → failed immediately: `bun: command not found`.
- `script /tmp/engine-core-transcript.txt sh -c 'bun run dev'` (escalated) → transcript records `sh: bun: command not found`.
- `/tmp/engine-core-transcript.txt` exists and currently contains the failed transcript from `bun run dev`.

## What remains

- Full verification could not be completed until a Bun runtime is available (`bun` command missing in this workspace).
- After installing Bun, run:
  - `bun test`
  - `bun run dev` (with a separate curl capture in the same session)
- Recheck transcript to confirm page rendering and successful server response.

