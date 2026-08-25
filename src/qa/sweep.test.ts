import { describe, expect, test } from "bun:test";

import { type Card, type Rank, valueFromRank } from "../engine/card";
import { createEngine, dealRound } from "../engine/engine";
import {
  baccaratPoint,
  shouldBankerDraw,
  shouldPlayerDraw,
  type Settlement,
} from "../engine/rules";
import {
  applyBankrollDelta,
  cloneBetHistory,
  settlementNet,
  totalWager,
} from "../ui/state";
import type { BetHistory, BetKind } from "../ui/types";

const FULL_SHOE_SEEDS = [
  "qa-full-shoe-alpha",
  "qa-full-shoe-bravo",
  "qa-full-shoe-charlie",
] as const;

function cards(ranks: readonly Rank[]): Card[] {
  return ranks.map((rank, id) => ({ id, rank, value: valueFromRank(rank) }));
}

function assertTableauLegal(result: ReturnType<typeof dealRound>): boolean {
  const playerInitial = baccaratPoint(result.playerCards.slice(0, 2));
  const bankerInitial = baccaratPoint(result.bankerCards.slice(0, 2));
  const natural = playerInitial >= 8 || bankerInitial >= 8;

  if (natural) {
    expect(result.playerCards).toHaveLength(2);
    expect(result.bankerCards).toHaveLength(2);
  } else {
    const playerDrew = shouldPlayerDraw(playerInitial);
    expect(result.playerCards).toHaveLength(playerDrew ? 3 : 2);
    const playerThirdValue = playerDrew
      ? baccaratPoint([result.playerCards[2]!])
      : null;
    expect(result.bankerCards).toHaveLength(
      shouldBankerDraw(bankerInitial, playerThirdValue) ? 3 : 2,
    );
  }

  expect(result.settlement.playerTotal).toBe(baccaratPoint(result.playerCards));
  expect(result.settlement.bankerTotal).toBe(baccaratPoint(result.bankerCards));
  expect(result.seenThisRound).toHaveLength(
    result.playerCards.length + result.bankerCards.length,
  );
  return natural;
}

function grossReturn(history: BetHistory, settlement: Settlement): number {
  const multipliers: Record<BetKind, number> = {
    player: settlement.mainPayouts.player,
    banker: settlement.mainPayouts.banker,
    tie: settlement.mainPayouts.tie,
    dragon: settlement.sidePayouts.dragon,
    panda: settlement.sidePayouts.panda,
  };

  return (Object.keys(multipliers) as BetKind[]).reduce((sum, kind) => {
    const stake = history[kind].reduce((subtotal, chip) => subtotal + chip, 0);
    const multiplier = multipliers[kind];
    return sum + (multiplier < 0 ? 0 : stake * (multiplier + 1));
  }, 0);
}

describe("full-game QA acceptance sweep", () => {
  for (const seed of FULL_SHOE_SEEDS) {
    test(`replays seed ${seed} legally through cut-card retirement with finite counts and a conserved bankroll`, () => {
      const engine = createEngine({ seed, cutOffset: 14 });
      const history = cloneBetHistory({
        player: [1],
        banker: [2],
        tie: [1],
        dragon: [1],
        panda: [1],
      });
      const initialBankroll = 10_000;
      let uiBankroll = initialBankroll;
      let cashLedger = initialBankroll;
      let totalSeenInRounds = 0;
      let naturalRounds = 0;
      let rounds = 0;

      while (!engine.shoe.retired) {
        const result = dealRound(engine);
        rounds += 1;
        naturalRounds += Number(assertTableauLegal(result));
        totalSeenInRounds += result.seenThisRound.length;

        for (const value of [
          engine.countState.dragonRunning,
          engine.countState.pandaRunning,
          engine.countState.decksRemaining,
          engine.countSignals.dragon.true,
          engine.countSignals.panda.true,
        ]) {
          expect(Number.isFinite(value)).toBe(true);
        }

        uiBankroll = applyBankrollDelta(
          uiBankroll,
          settlementNet(history, result.settlement),
        );
        cashLedger -= totalWager(history);
        cashLedger += grossReturn(history, result.settlement);
        expect(uiBankroll).toBe(cashLedger);
      }

      expect(rounds).toBeGreaterThan(0);
      expect(naturalRounds).toBeGreaterThan(0);
      expect(engine.countState.seenCount).toBe(1 + totalSeenInRounds);
      expect(engine.shoe.nextIndex).toBeGreaterThanOrEqual(engine.shoe.cutIndex);
      expect(() => dealRound(engine)).toThrow("shoe retired");
    });
  }

  test("a dealt three-card Player 8 beats Banker 7 and pays Panda 8 at 25:1", () => {
    const engine = createEngine({
      // Exposed A, one unseen burn, then P1/B1/P2/B2/P3.
      initialCards: cards(["A", "K", "A", "2", "4", "5", "3", "K"]),
      decks: 1,
      cutOffset: 1,
      shuffle: false,
    });

    const result = dealRound(engine);
    expect(result.playerCards.map(({ rank }) => rank)).toEqual(["A", "4", "3"]);
    expect(result.bankerCards.map(({ rank }) => rank)).toEqual(["2", "5"]);
    expect(result.settlement).toMatchObject({
      outcome: "player",
      playerTotal: 8,
      bankerTotal: 7,
      isPanda: true,
      mainPayouts: { player: 1 },
      sidePayouts: { panda: 25 },
    });
  });

  test("either opening natural short-circuits every third-card draw", () => {
    for (const ranks of [
      ["A", "K", "8", "7", "T", "T"],
      ["A", "K", "7", "9", "T", "T"],
    ] as const) {
      const result = dealRound(createEngine({
        initialCards: cards(ranks),
        decks: 1,
        cutOffset: 1,
        shuffle: false,
      }));
      expect(result.playerCards).toHaveLength(2);
      expect(result.bankerCards).toHaveLength(2);
      expect(result.seenThisRound).toHaveLength(4);
    }
  });
});
