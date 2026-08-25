import { describe, expect, test } from "bun:test";

import type { Settlement } from "../engine/rules";
import {
  applyBankrollDelta,
  canPlaceChip,
  canRestoreHistory,
  cloneBetHistory,
  computeBetMultipliers,
  createEmptyBetHistory,
  placeChip,
  removeLastChip,
  settlementNet,
  totalWager,
} from "./state";

function settlement(overrides: Partial<Settlement>): Settlement {
  return {
    outcome: "banker",
    playerTotal: 5,
    bankerTotal: 7,
    isDragon: false,
    isPanda: false,
    mainPayouts: {
      player: -1,
      banker: 1,
      tie: -1,
    },
    sidePayouts: {
      dragon: -1,
      panda: -1,
    },
    ...overrides,
  };
}

describe("bet state reducer", () => {
  test("places and removes chips immutably while keeping accurate totals", () => {
    const empty = createEmptyBetHistory();
    const withPlayer = placeChip(empty, "player", 25);
    const withTie = placeChip(withPlayer, "tie", 5);

    expect(totalWager(empty)).toBe(0);
    expect(totalWager(withPlayer)).toBe(25);
    expect(totalWager(withTie)).toBe(30);
    expect(empty.player).toEqual([]);

    const removed = removeLastChip(withTie, "player");
    expect(removed.removed).toBe(25);
    expect(totalWager(removed.history)).toBe(5);
  });

  test("caps placement and rebet against bankroll", () => {
    const history = cloneBetHistory({
      player: [100, 25],
      dragon: [25],
    });

    expect(canPlaceChip(200, history, 25)).toBe(true);
    expect(canPlaceChip(149, history, 25)).toBe(false);
    expect(canRestoreHistory(150, history)).toBe(true);
    expect(canRestoreHistory(149, history)).toBe(false);
  });
});

describe("settlement math", () => {
  test("preserves Dragon push and side-bet win math from engine payouts", () => {
    const history = cloneBetHistory({
      banker: [25],
      dragon: [5],
      tie: [1],
    });
    const result = settlement({
      isDragon: true,
      mainPayouts: { player: -1, banker: 0, tie: -1 },
      sidePayouts: { dragon: 40, panda: -1 },
    });

    expect(computeBetMultipliers(history, result)).toEqual({
      banker: 0,
      dragon: 40,
      tie: -1,
    });
    expect(settlementNet(history, result)).toBe(199);
  });

  test("clamps bankroll at zero after losses", () => {
    expect(applyBankrollDelta(1000, 285)).toBe(1285);
    expect(applyBankrollDelta(25, -100)).toBe(0);
  });
});
