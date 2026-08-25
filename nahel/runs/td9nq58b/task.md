---
run: td9nq58b
item: 9x1w62ms
role: dev
created: 2026-08-25T03:15:07Z
---
# Task — restore the type cleanup (lost to a host git incident). engine-core (9x1w62ms), drive ekq4swkd

Behavior is green (20/20 incl. the QA oracle). `npx tsc --noEmit` fails:

1. src/engine/shoe.ts:123,125 — TS2304 `Rank` in dead exports
   rankFromValue / normalizeCardSequence / isNatural (zero call sites):
   DELETE all three (no dead code).
2. engine.test.ts:1 + qa-probe.test.ts:1 — TS2307 bun:test types: add
   `"types": ["bun-types"]` to tsconfig compilerOptions and `bun-types` to
   devDependencies (the host will bun install).
3. qa-probe.test.ts:189 — TS2869 (?? unreachable): make the minimal
   TYPE-ONLY edit that clears it without changing what the test asserts.
4. package.json build must be "tsc --noEmit && vite build".

Do not change any test's behavioral assertions. bun not on PATH; host
verifies. No git commits. Result to your run result.md.
