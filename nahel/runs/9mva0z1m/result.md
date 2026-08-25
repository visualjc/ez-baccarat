---
run: 9mva0z1m
item: 9x1w62ms
status: success
summary: Updated the engine test control-order to use player/banker/player/banker draws.
---

- Updated `src/engine/engine.test.ts` in the `deals cards as player, banker, player, banker from a seeded shoe` test.
- Replaced the control-card initialization so cards are drawn in strict `P,B,P,B` order via explicit `p1`, `b1`, `p2`, `b2` draws.
- Kept all later third-card and seen-list logic unchanged, including sequential `seenThisRound` construction.
- No engine code or assertions were changed.
