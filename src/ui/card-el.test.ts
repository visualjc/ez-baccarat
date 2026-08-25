import { expect, test } from "bun:test";

import type { Card } from "../engine/card";
import { spokenCard, suitOf } from "./card-el";

const card = (id: number, rank: Card["rank"]): Card => ({ id, rank, value: 0 });

test("a card's suit follows its deck position, and the four cycle", () => {
  expect([0, 1, 2, 3].map((id) => suitOf(card(id, "A")))).toEqual(["♠", "♥", "♦", "♣"]);
  expect(suitOf(card(4, "A"))).toBe("♠");
});

test("the spoken identity carries everything the face shows", () => {
  // The face is aria-hidden, so this string is the only route a screen reader
  // has to what a sighted player reads off the card — rank AND suit.
  expect(spokenCard(card(0, "A"))).toBe("ace of spades");
  expect(spokenCard(card(1, "K"))).toBe("king of hearts");
  expect(spokenCard(card(2, "T"))).toBe("ten of diamonds");
  expect(spokenCard(card(3, "Q"))).toBe("queen of clubs");
  expect(spokenCard(card(4, "J"))).toBe("jack of spades");
});

test("number ranks are spoken as themselves, not spelled out", () => {
  expect(spokenCard(card(0, "2"))).toBe("2 of spades");
  expect(spokenCard(card(1, "9"))).toBe("9 of hearts");
});
