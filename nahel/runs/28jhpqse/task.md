---
run: 28jhpqse
item: 9x1w62ms
role: dev
created: 2026-08-25T03:02:51Z
---
# Task — finish the fix step, engine-core (9x1w62ms), drive run ekq4swkd

Your fix run b5fqkt71 landed; host ran the suite: 9/10 pass, your NEW
deal-order test fails:

    engine.test.ts:102 — deal order > deals cards as player, banker, player,
    banker from a seeded shoe
    playerCards ids: expected [.., 12, 19], received [.., 12, 10]

The mismatch is in the THIRD-card region. Determine which side is wrong:
walk the seeded shoe by hand (initial deal order player,banker,player,banker
= shoe cards 0,1,2,3; player third = card 4 when the tableau draws it;
banker third = the NEXT card after any player draw). Fix the wrong side —
the engine if it deals thirds out of order, or the test fixture if it was
hand-computed wrong. Never weaken the assertion shape (exact id sequences
from the seed stay).

bun is not on your PATH; the host verifies. Do not commit to git. Append
what you found and changed to your run result.md.
