import { describe, expect, test } from "bun:test";
import type { CountPairSignal } from "../engine/counts";
import { createEngine, dealRound } from "../engine/engine";
import { thresholdDistance, trueCount } from "./count-format";
import { describeRound } from "./count-narration";

// Independent oracle transcribed from PRODUCT.md's two tag tables. None of
// these expected tags or running counts are produced with engine tag helpers.
const expectedOpening = {
  rank: "T",
  dragonTag: 0,
  pandaTag: 1,
  dragonRunningAfter: 0,
  pandaRunningAfter: 1,
} as const;

const expectedRounds = [
  {
    cards: [
      ["4", -1, -2, -1, -1],
      ["K", 0, 1, -1, 0],
      ["6", -1, -1, -2, -1],
      ["A", 0, 1, -2, 0],
      ["9", 2, 4, 0, 4],
      ["4", -1, -2, -1, 2],
    ],
    after: [-1, 2, 7, 409 / 52],
    displays: ["−0.1", "0.2"],
    narration: {
      dragon: "Dragon −1: three −1 cards (4, 6, 4) against one +2 card (9); two neutral (K, A). True 0.0 → −0.1, still under +4.",
      panda: "Panda +1: one +4 card (9) and two +1 cards (K, A) against two −2 cards (4, 4) and one −1 card (6). True 0.1 → 0.2, still under +11.",
    },
  },
  {
    cards: [
      ["4", -1, -2, -2, 0],
      ["7", -1, -1, -3, -1],
      ["2", 0, 1, -3, 0],
      ["A", 0, 1, -3, 1],
    ],
    after: [-3, 1, 11, 405 / 52],
    displays: ["−0.3", "0.1"],
    narration: {
      dragon: "Dragon −2: two −1 cards (4, 7); two neutral (2, A). True −0.1 → −0.3, still under +4.",
      panda: "Panda −1: one −2 card (4) and one −1 card (7) against two +1 cards (2, A). True 0.2 → 0.1, still under +11.",
    },
  },
  {
    cards: [
      ["5", -1, -2, -4, -1],
      ["5", -1, -2, -5, -3],
      ["2", 0, 1, -5, -2],
      ["6", -1, -1, -6, -3],
      ["4", -1, -2, -7, -5],
    ],
    after: [-7, -5, 16, 400 / 52],
    displays: ["−0.9", "−0.6"],
    narration: {
      dragon: "Dragon −4: four −1 cards (5, 5, 6, 4); one neutral (2). True −0.3 → −0.9, still under +4.",
      panda: "Panda −6: three −2 cards (5, 5, 4) and one −1 card (6) against one +1 card (2). True 0.1 → −0.6, still under +11.",
    },
  },
] as const;

function traceTuple(card: {
  rank: string;
  dragonTag: number;
  pandaTag: number;
  dragonRunningAfter: number;
  pandaRunningAfter: number;
}) {
  return [card.rank, card.dragonTag, card.pandaTag, card.dragonRunningAfter, card.pandaRunningAfter];
}

describe("mechanical count-panel QA probe", () => {
  test("drives a burn and three seeded rounds through literal tag, display, narration, and continuity oracles", () => {
    const engine = createEngine({ seed: "panel-qa-mechanical", decks: 8, cutOffset: 14 });

    expect(engine.unseenBurnCards).toHaveLength(10);
    expect(engine.openingCounts.trace.cards).toEqual([expectedOpening]);
    expect(engine.openingCounts.state).toEqual({
      dragonRunning: 0,
      pandaRunning: 1,
      seenCount: 1,
      decksRemaining: 415 / 52,
    });
    expect(describeRound(engine.openingCounts.trace)).toEqual({
      dragon: "Dragon unchanged: one 0 card (T) — no movement. True 0.0 → 0.0, still under +4.",
      panda: "Panda +1: one +1 card (T). True 0.0 → 0.1, still under +11.",
    });

    let previousAfter: CountPairSignal = engine.openingCounts.trace.after;
    for (const expected of expectedRounds) {
      const round = dealRound(engine);
      expect(round.counts.trace.before).toEqual(previousAfter);
      expect(round.counts.trace.cards.map(traceTuple)).toEqual(expected.cards);
      expect([
        round.counts.state.dragonRunning,
        round.counts.state.pandaRunning,
        round.counts.state.seenCount,
        round.counts.state.decksRemaining,
      ]).toEqual(expected.after);
      expect([
        trueCount(round.counts.trace.after.dragon.true),
        trueCount(round.counts.trace.after.panda.true),
      ]).toEqual(expected.displays);
      expect(describeRound(round.counts.trace)).toEqual(expected.narration);
      previousAfter = round.counts.trace.after;
    }
  });

  test("keeps both bet signals and conservative displays exact at their boundaries", () => {
    const states: CountPairSignal[] = [
      {
        dragon: { running: 0, true: 3.96, signal: false },
        panda: { running: 0, true: 10.96, signal: false },
      },
      {
        dragon: { running: 0, true: 4.0, signal: true },
        panda: { running: 0, true: 11.0, signal: true },
      },
    ];

    expect(states.map(({ dragon, panda }) => ({
      dragon: [trueCount(dragon.true), dragon.signal, thresholdDistance(Math.abs(4 - dragon.true))],
      panda: [trueCount(panda.true), panda.signal, thresholdDistance(Math.abs(11 - panda.true))],
    }))).toEqual([
      { dragon: ["3.9", false, "0.1"], panda: ["10.9", false, "0.1"] },
      { dragon: ["4.0", true, "0.0"], panda: ["11.0", true, "0.0"] },
    ]);
  });
});
