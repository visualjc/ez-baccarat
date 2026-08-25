import { describe, expect, test } from "bun:test";
import { Card, Rank, valueFromRank } from "./card";
import {
  advanceRoundCountState,
  createInitialCountState,
  isDragonBetSignal,
  isPandaBetSignal,
} from "./counts";
import { createEngine, dealRound } from "./engine";

function card(rank: Rank, id: number): Card {
  return { id, rank, value: valueFromRank(rank) };
}

function openingNineFixture(): Card[] {
  const ranks: Rank[] = [
    "9",
    // These nine cards are burned face-down. Every one has a non-zero tag,
    // so including any of them in either running count is observable.
    "8", "8", "8", "8", "8", "8", "8", "8", "8",
    // First round, dealt P1 B1 P2 B2. Player has a natural 8, so no draws.
    "A", "2", "7", "3",
  ];

  while (ranks.length < 416) ranks.push("K");
  return ranks.map((rank, id) => card(rank, id));
}

describe("counts adversarial QA probe", () => {
  test("counts an exposed 9 before round one, ignores all face-down burns, and preserves exact fractions", () => {
    const state = createEngine({
      initialCards: openingNineFixture(),
      shuffle: false,
      cutOffset: 14,
    });

    // Only the exposed 9 is seen: Dragon +2, Panda +4. The nine face-down
    // eights would add Dragon +18 / Panda -18 if accidentally counted.
    expect(state.unseenBurnCards).toHaveLength(9);
    expect(state.unseenBurnCards.every(({ rank }) => rank === "8")).toBe(true);
    expect(state.countState).toEqual({
      dragonRunning: 2,
      pandaRunning: 4,
      seenCount: 1,
      decksRemaining: 415 / 52,
    });
    expect(state.countSignals.dragon.true).toBe(104 / 415);
    expect(state.countSignals.panda.true).toBe(208 / 415);

    const round = dealRound(state);
    expect(round.seenThisRound.map(({ rank }) => rank)).toEqual(["A", "2", "7", "3"]);
    expect(state.countState).toEqual({
      dragonRunning: 1,
      pandaRunning: 3,
      seenCount: 5,
      decksRemaining: 411 / 52,
    });
    // Host reconciliation (journaled): running/(unseen/52) and k/411 differ
    // in op order by 1 ulp — the math is exact, the comparison was too strict.
    expect(state.countSignals.dragon.true).toBeCloseTo(52 / 411, 12);
    expect(state.countSignals.panda.true).toBeCloseTo(156 / 411, 12);
  });

  test("turns signals on at the inclusive boundaries and off immediately below", () => {
    expect(isDragonBetSignal(4)).toBe(true);
    expect(isDragonBetSignal(3.9999)).toBe(false);
    expect(isPandaBetSignal(11)).toBe(true);
    expect(isPandaBetSignal(10.9999)).toBe(false);
  });

  test("chains every card transition without a gap or reset", () => {
    const seenRanks: Rank[] = ["9", "A", "2", "7", "3"];
    let state = createInitialCountState();
    let previousAfter = null;

    for (const [index, rank] of seenRanks.entries()) {
      const transition = advanceRoundCountState(state, [card(rank, index)]);
      if (previousAfter !== null) {
        expect(transition.trace.before).toEqual(previousAfter);
      }
      previousAfter = transition.trace.after;
      state = transition.state;
    }

    expect(state.dragonRunning).toBe(1);
    expect(state.pandaRunning).toBe(3);
    expect(state.seenCount).toBe(5);
  });
});
