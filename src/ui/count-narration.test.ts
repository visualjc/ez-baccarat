import { expect, test } from "bun:test";
import type { CountRoundTrace } from "../engine/counts";
import { describeRound } from "./count-narration";
const trace: CountRoundTrace = { cards: [
  { rank: "5", dragonTag: -1, pandaTag: -2, dragonRunningAfter: -1, pandaRunningAfter: -2 },
  { rank: "5", dragonTag: -1, pandaTag: -2, dragonRunningAfter: -2, pandaRunningAfter: -4 },
  { rank: "4", dragonTag: -1, pandaTag: -2, dragonRunningAfter: -3, pandaRunningAfter: -6 },
  { rank: "8", dragonTag: 2, pandaTag: -2, dragonRunningAfter: -1, pandaRunningAfter: -8 },
], before: { dragon: { running: 0, true: 3.4, signal: false }, panda: { running: 0, true: 2.1, signal: false } }, after: { dragon: { running: -1, true: 3.2, signal: false }, panda: { running: -8, true: 1.9, signal: false } } };
test("narration buckets ranks by tag value and spells threshold state", () => {
  expect(describeRound(trace).dragon).toBe("Dragon −1: three −1 cards (5, 5, 4) against one +2 card (8). True 3.4 → 3.2, still under +4.");
  expect(describeRound(trace).panda).toBe("Panda −8: four −2 cards (5, 5, 4, 8). True 2.1 → 1.9, still under +11.");
});
