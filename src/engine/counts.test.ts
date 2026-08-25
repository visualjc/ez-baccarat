import { describe, expect, test } from "bun:test";
import { Card, RANKS, valueFromRank } from "./card";
import {
  advanceRoundCountState,
  createInitialCountState,
  DRAGON_COUNT_THRESHOLD,
  DRAGON_TAG_TABLE,
  isDragonBetSignal,
  isPandaBetSignal,
  PANDA_COUNT_THRESHOLD,
  PANDA_TAG_TABLE,
} from "./counts";
import { createEngine, dealRound } from "./engine";

function makeCard(rank: Card["rank"], id = 0): Card {
  return { id, rank, value: valueFromRank(rank) };
}

describe("dragon count tags", () => {
  test("are exhaustive for all ranks and exact by rank", () => {
    const expected = {
      "4": -1,
      "5": -1,
      "6": -1,
      "7": -1,
      "8": 2,
      "9": 2,
      A: 0,
      "2": 0,
      "3": 0,
      T: 0,
      J: 0,
      Q: 0,
      K: 0,
    };

    expect(Object.keys(DRAGON_TAG_TABLE)).toHaveLength(RANKS.length);
    for (const rank of RANKS) {
      expect(DRAGON_TAG_TABLE[rank]).toBe(expected[rank]);
    }
  });
});

describe("panda count tags", () => {
  test("are exhaustive for all ranks and exact by rank", () => {
    const expected = {
      T: 1,
      J: 1,
      Q: 1,
      K: 1,
      A: 1,
      "2": 1,
      "3": -2,
      "4": -2,
      "5": -2,
      "6": -1,
      "7": -1,
      "8": -2,
      "9": 4,
    };

    expect(Object.keys(PANDA_TAG_TABLE)).toHaveLength(RANKS.length);
    for (const rank of RANKS) {
      expect(PANDA_TAG_TABLE[rank]).toBe(expected[rank]);
    }
  });
});

describe("round truthy thresholds", () => {
  test("are inclusive at 4.00/11.00 and reject just-below edges", () => {
    expect(DRAGON_COUNT_THRESHOLD).toBe(4);
    expect(PANDA_COUNT_THRESHOLD).toBe(11);
    expect(isDragonBetSignal(3.99)).toBe(false);
    expect(isDragonBetSignal(4)).toBe(true);
    expect(isPandaBetSignal(10.999)).toBe(false);
    expect(isPandaBetSignal(11)).toBe(true);
  });
});

describe("round trace math", () => {
  test("builds opening-round visibility with burn card included and updates before/after accurately", () => {
    const state = createInitialCountState();
    const roundCards = [makeCard("A"), makeCard("9"), makeCard("2")];
    const result = advanceRoundCountState(state, roundCards);

    expect(result.trace.cards).toEqual([
      { rank: "A", dragonTag: 0, pandaTag: 1, dragonRunningAfter: 0, pandaRunningAfter: 1 },
      { rank: "9", dragonTag: 2, pandaTag: 4, dragonRunningAfter: 2, pandaRunningAfter: 5 },
      { rank: "2", dragonTag: 0, pandaTag: 1, dragonRunningAfter: 2, pandaRunningAfter: 6 },
    ]);
    expect(result.trace.before.dragon.running).toBe(0);
    expect(result.trace.before.dragon.true).toBe(0);
    expect(result.trace.before.dragon.signal).toBe(false);
    expect(result.trace.before.panda.running).toBe(0);
    expect(result.trace.before.panda.true).toBe(0);
    expect(result.trace.before.panda.signal).toBe(false);

    const seenCount = roundCards.length;
    const decksRemaining = (416 - seenCount) / 52;
    expect(result.state.seenCount).toBe(seenCount);
    expect(result.state.decksRemaining).toBe(decksRemaining);
    expect(result.trace.after.dragon.running).toBe(2);
    expect(result.trace.after.panda.running).toBe(6);
    expect(result.trace.after.dragon.true).toBeCloseTo(2 / decksRemaining);
    expect(result.trace.after.panda.true).toBeCloseTo(6 / decksRemaining);
    expect(result.trace.after.dragon.signal).toBe(false);
    expect(result.trace.after.panda.signal).toBe(false);
  });
});

test("engine keeps the exposed burn trace separate from round one", () => {
  const engine = createEngine({ seed: "count-panel-burn", decks: 1, cutOffset: 1 });
  const openingSeen = engine.openingCounts.state.seenCount;
  const result = dealRound(engine);
  expect(result.counts.trace.before.dragon.running).toBe(engine.openingCounts.trace.after.dragon.running);
  expect(result.counts.state.seenCount).toBe(openingSeen + result.seenThisRound.length);
  expect(result.counts.trace.cards).toHaveLength(result.seenThisRound.length);
});
