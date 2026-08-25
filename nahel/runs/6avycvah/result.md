---
run: 6avycvah
item: fc5v6szj
status: success
summary: Increased the counting-seam fixture deck size so opening burn plus full first-round draw cannot deplete the shoe.
---

- Updated `src/engine/engine.test.ts` in the `"counting seam"` test fixture.
- Added two cards to `initialCards` so the shoe contains enough cards for:
  - the exposed opening burn draw,
  - the opened burn-card consumption,
  - and a full first-round draw path.
- Confirmed root cause: with `cutOffset: 1` and exposed burn `A` (`burnCount = 1`), the original 6-card fixture provided only 4 cards for the round and could throw `shoe depleted`.
- Left the seam/test assertions unchanged.
- No seam logic changes were made; only fixture padding.
- Tests not run in-session (bun path is unavailable per task note).
