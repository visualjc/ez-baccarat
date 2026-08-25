# ADR-0001: Stack — Vite + TypeScript, no UI framework, Bun for tests

- Status: accepted (founding)
- Date: 2026-08-25

## Context

The constitution demands a self-contained client-side web app (hard
constraint 3), exact deterministic game math (HC 1), animations and a
deliberate palette (HC 5), and TDD for the math (HC 6). Implementation is
dispatched to codex gpt-5.3-codex-spark — a fast model that does best with a
small, conventional surface area.

## Decision

- **Vite + TypeScript** for the app: instant dev server, static build,
  zero backend.
- **No UI framework**: the DOM surface is one table view and one count
  panel; plain TS modules + CSS animations/transitions keep the dependency
  graph near zero and the whole app reviewable in one sitting.
- **Bun test** for the engine: all game math (shoe, tableau, settlement,
  counts) lives in pure modules under `src/engine/` with exhaustive tests;
  DOM code stays thin and untested-by-unit (QA drives it).
- **Deterministic RNG seam**: the shuffle takes an injectable RNG so tests
  and replays are reproducible; the UI uses a seeded-or-random toggle.

## Consequences

- `bun install`, `bun run dev` (vite), `bun test`, `bun run build` — the run
  contract is four commands.
- Any future framework adoption is a new ADR.
