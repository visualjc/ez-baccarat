---
run: xqvftbqd
item: wf7yak5w
status: success
summary: Reviewed fix/rail-gutter and found one test-coverage gap in the required single-padding invariant
---

# Review — PR #2: rail gutter

Reviewed `fix/rail-gutter` against `main` at `186d98a` (`fix(table): gutter the felt rim from the UI`). No product code was changed.

## What checked clean

- The felt, noise overlay, and burn scrim all use `var(--rail-w)` alone at `src/styles/app.css:222`, `:232`, and `:878`; the burn scrim therefore remains flush with the felt rather than forming an inner bright ring.
- The relevant remaining `22px` values are the intended `--rail-w` token at `src/styles/tokens.css:91` and the unrelated count-panel row height at `src/styles/app.css:182`.
- The radius arithmetic is centralized in `--felt-radius`, used by all three felt layers.
- The responsive gutter values are `20px`, `14px`, and `10px`. Given the existing constrained tray layout at the intermediate breakpoint, this is a proportionate responsive adjustment rather than over-fitting.
- The padding-box shift does not break the checked geometry: shoe/card source and target rectangles are read live with `getBoundingClientRect()`, and celebration converts an element rectangle relative to its current host rectangle. No chip-flight consumer of `chipTray.originRect()` exists.
- No material standards or code-smell finding: this task explicitly requires the UI stylesheet test, which is a task-specific exception to ADR-0001's normal engine-only unit-test convention.

## Verification limits

`git diff --check main...fix/rail-gutter` passed. `bun`, `bunx`, and `nahel` are unavailable on PATH in this worker, so `bun test`, `bunx tsc --noEmit`, `nahel brief`, and the requested `nahel run update xqvftbqd --phase review` could not run. This result document is the degraded-environment handoff.

VERDICT: REQUEST CHANGES

1. `src/ui/table-shell.test.ts:14-17` does not enforce the task's required single padding site or that `--felt-gutter` applies to the table padding and nothing else. It merely finds one unscoped matching padding declaration and requires at least one gutter reference, so it still passes after another selector starts using the gutter. Match/count the `#table-view` padding declaration specifically and reject extra gutter-bearing uses (while allowing the two breakpoint token overrides); binding each rail-inset assertion to its intended selector would make the same protection more robust.
