import { expect, test } from "bun:test";
import { countWord, decks, thresholdDistance, trueCount } from "./count-format";
test("count formatting truncates toward zero and normalizes negative zero", () => {
  expect(trueCount(-0.01)).toBe("0.0");
  expect(trueCount(3.96)).toBe("3.9");
  expect(trueCount(3.99)).toBe("3.9");
  expect(trueCount(4)).toBe("4.0");
  expect(trueCount(4.04)).toBe("4.0");
  expect(trueCount(-3.96)).toBe("−3.9");
});

test("threshold distances always round up without float artifacts", () => {
  expect(thresholdDistance(0.04)).toBe("0.1");
  expect(thresholdDistance(0.35)).toBe("0.4");
  expect(thresholdDistance(10.899999999999999)).toBe("10.9");
  expect(thresholdDistance(0)).toBe("0.0");
});

test("deck and count-word formatting", () => {
  expect(decks(7.9807)).toBe("7.98");
  expect(countWord(13)).toBe("13");
});
