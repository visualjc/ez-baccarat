---
run: t6xn5qwk
item: 7rfz93dh
role: dev
created: 2026-08-25T03:23:29Z
---
# Task — app-shell-table (item 7rfz93dh), build-review/implement, drive run xe6r970y

## Scope (PRD F2 + F4.1)

Implement the table view + app shell EXACTLY per the design spec at
docs/design/7rfz93dh.md — read it in FULL first; every hex, duration, and
easing in it is literal, and its component inventory (mount… modules) is
the file layout. The engine already exists (src/engine/ — pure, tested;
settlement is signed net per unit stake; counts.ts has the trace seam).

Build:
- src/styles/tokens.css (the spec's token block verbatim) + component CSS
- the mount modules the spec names (table surface, shoe, hand zones, bet
  spots for all five wagers, chip tray + bankroll with localStorage,
  outcome banner incl. DRAGON!/PANDA! celebrations, burn ritual, controls)
- keyboard map per the spec; seeded mode via ?seed= query param (F4.2)
- reserve the count-panel dock region per the spec's seam (the panel itself
  is a SIBLING item — leave the mount point + a typed interface only)
- wire src/main.ts: new shoe → burn ritual → bet → deal loop, driving
  src/engine and rendering per spec

Engine stays untouched EXCEPT the minimal seam the spec's interface section
names (if any). TDD where testable without DOM (bet/bankroll logic,
keyboard reducer, seed parsing) — DOM modules stay thin. bun is NOT on your
PATH: write code; the host runs suite + tsc + build and drives the app,
reporting failures back. Do not commit to git. Result to run result.md.
