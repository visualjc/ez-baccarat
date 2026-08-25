---
run: b5fqkt71
item: 9x1w62ms
role: dev
created: 2026-08-25T03:00:55Z
---
# Task — fix accepted panel findings, engine-core (9x1w62ms), build-review/fix, drive run ekq4swkd

Accepted findings (both reviewers' full reports: nahel/runs/91vnqpb0/result.md,
nahel/runs/wxqa5c2c/result.md):

1. DEAL ORDER (terra P1): engine.ts deals Player,Player,Banker,Banker; punto
   banco is Player,Banker,Player,Banker. Fix the order; ADD a red-first test
   asserting the card assignment from a known seeded shoe.
2. SETTLEMENT CONVENTION (terra P1): pick ONE convention — signed net per
   unit stake for EVERY wager: Player/Banker win +1 / lose -1 / push 0;
   Tie win +8 / lose -1; Dragon 7 win +40 / lose -1; Panda 8 win +25 /
   lose -1 (side bets lose when they do not hit; dragon pushes BANKER MAIN
   only, the Dragon 7 side bet WINS there). ADD red-first loss assertions
   for tie/dragon/panda losing paths.
3. TYPE CLEANLINESS (both): `npx tsc --noEmit -p tsconfig.json` must exit 0.
   shoe.ts:119-128 exports rankFromValue/normalizeCardSequence/isNatural are
   dead (zero call sites) AND carry TS2304 — DELETE them (no dead code).
   Fix the bun:test type complaint (add "bun-types" to tsconfig types or
   devDependency `@types/bun`). Change package.json build script to
   "tsc --noEmit && vite build" so the type check gates the build.

NOT in scope (host dispositions, journaled): counts (terra P0) belong to
item engine-counts; transcript depth (terra P2) is noted, app drives the
engine from app-shell onward.

Rules: red-first where testable; never weaken an existing assertion. bun is
NOT on your PATH — write code and tests; the host runs the suite. Do not
commit to git. Result to your run dir's result.md: each finding with what
changed for it.
