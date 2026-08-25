import { expect, test } from "bun:test";
import { countWord, decks, trueCount } from "./count-format";
test("count formatting normalizes negative zero and large count words", () => {
  expect(trueCount(-0.01)).toBe("0.0");
  expect(decks(7.9807)).toBe("7.98");
  expect(countWord(13)).toBe("13");
});
