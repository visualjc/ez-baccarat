import { expect, test } from "bun:test";
import { createEngine, dealRound } from "../engine/engine";
import { valueFromRank, type Card } from "../engine/card";
import { buildTimeline } from "./table-view";

function cards(ranks: string[]): Card[] {
  return ranks.map((rank, id) => ({ id, rank: rank as Card["rank"], value: valueFromRank(rank as Card["rank"]) }));
}

test("timeline uses engine presentation totals and tableau narration without re-deriving them", () => {
  const result = dealRound(createEngine({
    initialCards: cards(["A", "A", "2", "2", "2", "2", "4", "3"]),
    decks: 1,
    cutOffset: 1,
    shuffle: false,
  }));
  const steps = buildTimeline(result);

  expect(steps.map((step) => [step.seat, step.playerTotal, step.bankerTotal])).toEqual([
    ["player", 2, 0], ["banker", 2, 2], ["player", 4, 2],
    ["banker", 4, 4], ["player", 8, 4], ["banker", 8, 7],
  ]);
  expect(steps[4]?.ruleText).toBe(result.presentation.playerThirdNarration);
  expect(steps[5]?.ruleText).toBe(result.presentation.bankerThirdNarration);
});
