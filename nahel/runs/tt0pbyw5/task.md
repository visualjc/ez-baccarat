---
run: tt0pbyw5
item: 7rfz93dh
role: dev
created: 2026-08-25T03:59:47Z
---
# Task — fix accepted panel findings, app-shell-table (7rfz93dh), build-review/fix, drive xe6r970y

Both reviewers' full reports: nahel/runs/va8jgwpr/result.md and
nahel/runs/fxscy15m/result.md — READ BOTH; they localize every finding to
file:line. The design contract is docs/design/7rfz93dh.md. All accepted:

1. 1280px layout clip (P1): box-sizing/border-box + fluid bet-row (wrap or
   minmax grid) so the table fits its grid track at ≥1100px wide; nothing
   game-critical may clip at 1280x900 or 1440x900.
2. FAST (P1): fast-forward must complete the round near-instantly —
   speedScale must cut live timeouts AND CSS transition/animation durations
   (e.g. a .speed-fast root class scaling --anim-* custom props to ~0, plus
   cancelling pending waits).
3. Named animations (P1): implement the spec's §3 list as NAMED keyframes
   with the stated durations/easings — deal-slide, card-flip,
   third-card-emphasis (full), chip-place, chip-lift, win-sweep,
   win-payout, burn-expose (correct scale + slide), including the
   90/140/200ms staggers.
4. localStorage READS guarded like the writes (bankroll.ts, chip-tray.ts).
5. UI math authority (P2): totals and tableau narration read from engine
   round results (extend the engine result surface if a field is missing —
   engine change allowed ONLY as an additive result field with a test),
   never re-derived in the UI.
6. Keyboard focus order per the spec.
7. Tests: add regression tests where testable headlessly — speed-scale
   math, storage-guard fallback, totals-from-engine wiring; plus a
   layout-constant test if the bet-row math is now computed.

Red-first where testable; never weaken an assertion. bun NOT on your PATH;
the host verifies and re-drives in a browser. No git commits. Result to
your run result.md listing each finding → what changed.
