---
run: 1qf3cz58
item: 7rfz93dh
role: dev
created: 2026-08-25T03:27:16Z
---
# Task — COMPLETE the app-shell implement (item 7rfz93dh), build-review/implement, drive run xe6r970y

The previous dev worker (gpt-5.3-codex-spark, run t6xn5qwk) died mid-write
(vendor quota): src/ui/ holds 19 partial modules (game.ts has a syntax
error at line 256 — truncated mid-file), src/styles/ is EMPTY, src/main.ts
may be stale, and no result doc was written. You are its successor on the
same task.

THE TASK (original): implement docs/design/7rfz93dh.md — read it in FULL;
every hex, duration, easing is literal; its component inventory is the file
layout. PRD F2 + F4.1 scope: table view, five bet spots, chip tray +
bankroll (localStorage), deal/flip/draw animations, DRAGON!/PANDA!
celebrations, burn ritual, keyboard map, ?seed= param, count-panel dock
reserved with a typed interface. Engine (src/engine/) is done and tested —
drive it, do not modify it.

Approach: read the partial src/ui/ modules; keep what is sound, finish or
rewrite what is broken (game.ts is definitely truncated), create
src/styles/tokens.css from the spec's verbatim token block plus the
component CSS the spec defines, and wire src/main.ts. The result must:
`npx tsc --noEmit` clean, `bun test` green (25 existing tests must stay
green; add tests for pure logic — bet/bankroll reducer, seed parsing),
`vite build` clean.

bun is NOT on your PATH; the host verifies and drives the app in a real
browser. Do not commit to git. Result to YOUR run dir's result.md.
