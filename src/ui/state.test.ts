import { describe, expect, test } from "bun:test";

import type { Settlement } from "../engine/rules";
import type { BetHistory } from "./types";
import {
  applyBankrollDelta,
  canPlaceChip,
  canRestoreHistory,
  cloneBetHistory,
  computeBetMultipliers,
  createEmptyBetHistory,
  doubleBetHistory,
  placeChip,
  planDoubleWager,
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

  test("refuses over-bankroll scripted placements across spots without changing state", () => {
    let history = cloneBetHistory({ player: [75] });
    const place = (kind: keyof typeof history, amount: number) => {
      if (!canPlaceChip(100, history, amount)) {
        return false;
      }
      history = placeChip(history, kind, amount);
      return true;
    };

    expect(place("banker", 25)).toBe(true);
    expect(totalWager(history)).toBe(100);

    const beforeDeniedPlacement = history;
    expect(place("panda", 1)).toBe(false);
    expect(history).toBe(beforeDeniedPlacement);
    expect(history).toEqual(cloneBetHistory({ player: [75], banker: [25] }));

    expect(canRestoreHistory(100, history)).toBe(true);
    expect(canRestoreHistory(99, history)).toBe(false);
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

  test("rejects a settlement that would make bankroll negative", () => {
    expect(applyBankrollDelta(1000, 285)).toBe(1285);
    expect(() => applyBankrollDelta(25, -100)).toThrow("Bankroll invariant violated");
  });
});

test("2x doubles the live layout, and falls back to the last one when the felt is empty", () => {
  const empty = createEmptyBetHistory();
  const last: BetHistory = { ...createEmptyBetHistory(), player: [25], tie: [5] };

  // The round clears the felt before it settles, so this is the state a player
  // reaches for 2x from after every round.
  const fromLast = planDoubleWager(1000, empty, last);
  expect(fromLast.ok).toBe(true);
  expect(fromLast.source).toBe("last");
  expect(fromLast.history.player).toEqual([25, 25]);
  expect(fromLast.history.tie).toEqual([5, 5]);
  expect(fromLast.total).toBe(60);

  // A live layout always wins over history, however fat the history is.
  const current: BetHistory = { ...createEmptyBetHistory(), player: [25] };
  const fatLast: BetHistory = { ...createEmptyBetHistory(), banker: [500] };
  const fromCurrent = planDoubleWager(1000, current, fatLast);
  expect(fromCurrent.source).toBe("current");
  expect(fromCurrent.history.banker).toEqual([]);
  expect(fromCurrent.total).toBe(50);
});

test("2x refuses what the bankroll cannot cover instead of clamping it", () => {
  const affordable: BetHistory = { ...createEmptyBetHistory(), player: [500] };
  const exact = planDoubleWager(1000, affordable, undefined);
  expect(exact.ok).toBe(true);
  expect(exact.total).toBe(1000);

  const tooBig: BetHistory = { ...createEmptyBetHistory(), player: [600] };
  const refused = planDoubleWager(1000, tooBig, undefined);
  expect(refused.ok).toBe(false);
  expect(refused.reason).toBe("bankroll");
  expect(refused.total).toBe(1200);
  // A partial double would silently change which side the player is backing.
  expect(totalWager(refused.history)).toBe(0);
});

test("2x has nothing to do without a current or a last wager", () => {
  const none = planDoubleWager(1000, createEmptyBetHistory(), undefined);
  expect(none.ok).toBe(false);
  expect(none.source).toBe("none");
  expect(none.reason).toBe("no-wagers");

  const emptyLast = planDoubleWager(1000, createEmptyBetHistory(), createEmptyBetHistory());
  expect(emptyLast.reason).toBe("no-wagers");
});

test("2x is repeatable until the bankroll stops it", () => {
  const first = planDoubleWager(1000, { ...createEmptyBetHistory(), player: [100] }, undefined);
  expect(first.total).toBe(200);

  const second = planDoubleWager(1000, first.history, undefined);
  expect(second.total).toBe(400);
  expect(second.history.player).toEqual([100, 100, 100, 100]);

  const third = planDoubleWager(1000, second.history, undefined);
  expect(third.total).toBe(800);

  const fourth = planDoubleWager(1000, third.history, undefined);
  expect(fourth.ok).toBe(false);
  expect(fourth.reason).toBe("bankroll");
});

test("planning a double never mutates the histories it was handed", () => {
  const current: BetHistory = { ...createEmptyBetHistory(), player: [25] };
  const last: BetHistory = { ...createEmptyBetHistory(), banker: [10] };

  planDoubleWager(1000, current, last);
  planDoubleWager(1000, createEmptyBetHistory(), last);

  expect(current.player).toEqual([25]);
  expect(last.banker).toEqual([10]);
  expect(doubleBetHistory(current).player).toEqual([25, 25]);
  expect(current.player).toEqual([25]);
});
