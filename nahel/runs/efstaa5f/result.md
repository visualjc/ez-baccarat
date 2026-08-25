---
run: efstaa5f
item: pge65a4e
status: success
summary: Added the full-shoe QA ratchet, verified 64 tests green, supplied the visual checklist, and found one bankroll-limit defect for host triage.
---

# Full-game QA sweep

QA work completed against commit `78b6634` plus the dispatched working tree. I added `src/qa/sweep.test.ts`; it runs three fixed eight-deck shoes through cut-card retirement and checks tableau legality, natural short-circuits, finite count state, seen-card continuity, retirement, and an independent stake/return bankroll ledger. It also adds explicit dealt Panda 8 settlement and both Player/Banker natural fixtures.

Evidence:

- `/Users/jimcarter/.bun/bin/bun test src/qa/sweep.test.ts`: **5 pass, 0 fail, 2,664 assertions**.
- `/Users/jimcarter/.bun/bin/bun test`: **64 pass, 0 fail, 3,131 assertions across 14 files**.
- `./node_modules/.bin/tsc --noEmit`: **pass**.
- `bun run build`: TypeScript passed and Vite transformed all 36 modules, but the restricted worker sandbox denied Vite permission to clear the existing `dist/` (`EPERM` on unlink). The request for an unsandboxed rebuild was rejected. This is an environment park, not evidence of a product build failure. Existing `dist/index.html`, JS, and CSS artifacts are present.
- Static scan found no `fetch`, XHR, WebSocket, EventSource, beacon, or remote HTTP URL in `src/` or `index.html`; the only URL is an inline SVG data URI used for felt texture.
- `nahel` was not on PATH, so no Nahel journal/status mutations were made. Per the dispatch, no bug item was filed.

## Acceptance coverage map

### F1 — engine acceptance

| Required coverage | Current deterministic coverage |
| --- | --- |
| Tableau, all draw/stand cells | `src/engine/engine.test.ts:is exhaustively coded for player-third-by-banker-total cells`; `src/engine/engine.test.ts:banker follows player rule when player stands`; `src/qa/sweep.test.ts:replays seed … legally through cut-card retirement…` (three seeds) |
| Natural short-circuit | `src/engine/qa-probe.test.ts:player natural 8 beats banker 7 without either hand drawing`; `src/qa/sweep.test.ts:either opening natural short-circuits every third-card draw` |
| Settlement for every outcome flag | `src/engine/engine.test.ts:applies main/side outcomes for every flag path`; the five tests in `src/engine/qa-probe.test.ts:QA adversarial settlement and deal probes`; `src/qa/sweep.test.ts:a dealt three-card Player 8 beats Banker 7 and pays Panda 8 at 25:1` |
| Burn arithmetic | `src/engine/engine.test.ts:exposes first card and burns unseen cards`; `src/engine/engine.test.ts:uses baccarat burn arithmetic for exposed card values`; both tests in `src/engine/qa-probe.test.ts:QA burn and decks-remaining probes` |
| Count tags per rank | `src/engine/counts.test.ts:are exhaustive for all ranks and exact by rank` under both Dragon and Panda suites |
| True-count division and thresholds | `src/engine/counts.test.ts:builds opening-round visibility with burn card included and updates before/after accurately`; `src/engine/counts-qa-probe.test.ts:counts an exposed 9 before round one, ignores all face-down burns, and preserves exact fractions`; both threshold-boundary tests |
| Full deterministic shoe replay | Previously only three rounds in `src/engine/engine.test.ts:replays deterministically with seeded mode`. Gap now filled by the three seed-generated cases in `src/qa/sweep.test.ts`, through retirement, with finite-count, tableau, natural, seen-count, and bankroll invariants. |

### F2 — animated table acceptance

| Required coverage | Current deterministic coverage |
| --- | --- |
| Engine order and third-card presentation data | `src/ui/table-view.test.ts:timeline uses engine presentation totals and tableau narration without re-deriving them` |
| Deal/flip/third-card sequencing and pacing | `src/ui/timing.test.ts:a normal six-card DEAL-to-unlocked schedule stays within the CSS-token budget`; `src/ui/timing.test.ts:an overlapped timeline waits through the third-card emphasis before revealing it`; FAST-path timing tests |
| Animation visibly fires for natural, draw, tie, dragon, and panda | **NONE** headlessly proves pixels/classes fire on every outcome. Exact host cases are below. |

### F3 — count-panel acceptance

| Required coverage | Current deterministic coverage |
| --- | --- |
| Burn plus three rounds against literal tag tables | `src/ui/panel-qa-probe.test.ts:drives a burn and three seeded rounds through literal tag, display, narration, and continuity oracles` |
| Signal displays and thresholds | `src/ui/panel-qa-probe.test.ts:keeps both bet signals and conservative displays exact at their boundaries`; `src/ui/count-panel.test.ts:maps exact signal states to conservative Dragon and Panda displays and captions` |
| Burn/round trace reset and count continuity | `src/ui/count-panel.test.ts:resets the round trace while retaining count chains, only showing burn rows before round one` |
| Casino-mode hidden reconciliation | `src/ui/count-panel.test.ts:continues reconciling hidden casino-mode events and reveals current state` |
| QA hand-verification of rendered panel for three rounds including burn | **NONE** replaces the required visual check. Exact host steps are below. |

## Exploratory finding for host triage

### Wagers can exceed bankroll

Source inspection establishes the broken seam: `mountBetLayout` defaults `canPlace` to `() => true`; `mountTableView` neither passes a predicate nor calls `betLayout.setCanPlace`. The reducer-level `canPlaceChip` function is tested but unused by the live UI. This also makes the existing “Wager exceeds bankroll” callback unreachable during normal placement.

Repro:

1. Launch the app with a fresh/default `$1,000` bankroll.
2. Press `6` to select the `$1,000` chip.
3. Press `P` twice.
4. Observe the Player spot accepts a `$2,000` wager and DEAL remains available despite a `$1,000` bankroll.

Expected: the second chip is rejected and the status announces “Wager exceeds bankroll.”

Observed from the live wiring: every positive chip placement is accepted; settlement later clamps the bankroll at zero, masking the over-wager rather than preventing it.

Severity suggestion: **major** — it breaks the play-chip bankroll constraint in an ordinary keyboard or pointer flow. No item was filed and no production fix was made, per the dispatch. Host should reproduce in-browser, accept/reject the finding, and create the bug item plus expected-fail integration ratchet if accepted.

## Browser checklist for the host

Run `bun run dev`, wait for each opening burn ritual to finish, and use query-string seeds as strings exactly as shown.

### 1. Every animation outcome path

For each row, open a fresh URL, place a `$1` wager with the listed key, press Space once, and do not fast-forward. Confirm cards visibly slide from the shoe, flip face-up, the banner animates in, wagers settle, and controls unlock. Also confirm the stated special observation.

| Path | URL / actions | Expected cards and visual observation |
| --- | --- | --- |
| Natural | `/?seed=1`, press `P`, Space | Player `5,4` = natural 9; Banker `2,J` = 2. Exactly four cards; no third-card emphasis; PLAYER banner. |
| Draw | `/?seed=0`, press `B`, Space | Player `A,A,K`; Banker `8,6`. Player third card visibly follows the initial four and shows tableau-rule emphasis; BANKER banner. |
| Tie | `/?seed=4`, press `T`, Space | Player `A,7`; Banker `3,5`; TIE banner and 8:1 settlement treatment. |
| Dragon | `/?seed=60`, press `7`, Space | Player `4,J,Q`; Banker `8,4,5` = winning three-card 7. DRAGON! fire treatment/embers; Banker wager would push; Dragon pays 40:1. |
| Panda | `/?seed=32`, press `8`, Space | Player `6,4,8` = winning three-card 8; Banker `K,2,K`. PANDA! bamboo/light particle treatment; Panda pays 25:1. This is the requested Panda seed. |

For each path, verify the Count panel adds a row only when the corresponding card flips and the third-card caption matches the actual tableau decision. Repeat one draw round and press Space during playback: the control should switch to FAST and unlock promptly without leaving a card, banner, chip, or count row in a provisional state.

### 2. Three-round panel hand-check, including burn

1. Open `/?seed=panel-qa-mechanical` in Trainer mode.
2. During the opening ritual, verify exposed burn `T`, ten face-down burns, only `T` appears in the trace, Dragon RUN `0`, Panda RUN `+1`, and the face-down burns are explicitly uncounted.
3. Place any `$1` main bet and deal round 1. Expected seen ranks: `4,K,6,A,9,4`; resulting RUN values Dragon `−1`, Panda `+2`. The per-card tags and prose must match those ranks, not canned copy.
4. Rebet and deal round 2. Expected ranks: `4,7,2,A`; RUN Dragon `−3`, Panda `+1`.
5. Rebet and deal round 3. Expected ranks: `5,5,2,6,4`; RUN Dragon `−7`, Panda `−5`.
6. At every round, independently sum tags from the collapsible rules card and compare every trace row, delta sentence, true count, decks unseen, and BET/NO BET threshold caption.

### 3. Casino-mode self-test

1. Open `/?seed=panel-qa-mechanical`; note the opening `T` tags, then press `M`.
2. Confirm the panel is fully hidden, removed from keyboard focus/accessibility (`aria-hidden`/inert behavior), and the table recenters.
3. Mentally count round 1 (`4,K,6,A,9,4`) while hidden.
4. After settlement press `M` again. Confirm the revealed current state is Dragon RUN `−1`, Panda RUN `+2`, with the complete round trace and no replay/reset glitch.
5. Toggle repeatedly before and after another round; counts must continue from the prior state rather than restarting.

### 4. Keyboard-only play

Without using the pointer:

1. Press `3` (select `$25`), then `P`, `B`, `T`, `7`, `8`; verify each spot gains one chip and focus follows the shortcut-selected spot.
2. Press Backspace; verify the most recently touched (Panda) chip is removed. Press `C`; all bets clear.
3. Press `P`, Space to deal, and Space again while busy to FAST-forward. Confirm focus is not trapped and controls unlock.
4. Press `R` to restore the last wager; `M` twice to hide/reveal the panel; `?` to open/focus Count rules; Escape to dismiss the banner; `S` to request a new shoe and complete/cancel the native confirmation using only the keyboard.
5. Tab and Shift-Tab through all six chips, five bet spots, Clear/Rebet/DEAL, New Shoe, mode toggle, help, rules summary, and trace log. Every focus indicator must be visible and every enabled button must activate from the keyboard.

### 5. localStorage persistence

1. In a normal storage-enabled tab, record the bankroll, select `$100` with `4`, open Count rules, place a Player wager, and deal to produce a nonzero bankroll change.
2. Record the settled bankroll, then reload the same URL.
3. Expected: bankroll restores exactly, `$100` remains selected (`aria-checked=true`), and Count rules remains open. A new shoe may begin because shoe state is intentionally not persistent.
4. In DevTools Application/Storage, verify keys `ezbac.bankroll`, `ezbac.chip`, and `ezbac.rules`. Delete them and reload; bankroll should return to `$1,000`, chip to `$1`, and rules to closed.
5. Repeat in a context where storage access is blocked; the app must still mount and settle bets using safe defaults.

### 6. Static-host check

1. Outside the restricted worker sandbox, run `bun run build`; require exit 0 and a fresh `dist/index.html` plus hashed JS/CSS assets.
2. Serve only `dist/` with a static HTTP server and open it directly.
3. In DevTools Network, reload and play a full round. Expected: only same-origin static assets; no runtime API/network request.

## Verdict

- **F1 Acceptance — PASS.** Every named math category is deterministic and green, including the newly completed three-seed full-shoe replay through retirement.
- **F2 Acceptance — FAIL (not yet visually demonstrated).** Headless sequencing is green, but the acceptance bullet explicitly requires QA confirmation that animations fire on natural, draw, tie, dragon, and panda paths. The host checklist remains outstanding.
- **F3 Acceptance — FAIL (not yet hand-verified in a browser).** Literal mechanical coverage is green for the burn and three rounds, but the acceptance bullet explicitly requires hand-verification of the rendered panel. The host checklist remains outstanding.
- **Overall — FAIL pending host visual passes and bankroll-defect triage.** The QA assignment itself completed successfully; this product verdict is intentionally stricter than the run status.
