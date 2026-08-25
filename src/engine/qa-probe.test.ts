import { describe, expect, test } from "bun:test";
import { buildOrderedDeck, Card, Rank, valueFromRank } from "./card";
import { createEngine, dealRound } from "./engine";
import { createSeededRng } from "./rng";
import {
  baccaratPoint,
  settleHand,
  shouldBankerDraw,
  shouldPlayerDraw,
} from "./rules";
import {
  burnCountForCard,
  cardsRemaining,
  createShoe,
  drawCard,
  finalizeRound,
  openShoeWithBurn,
} from "./shoe";

function cards(ranks: Rank[]): Card[] {
  return ranks.map((rank, id) => ({ id, rank, value: valueFromRank(rank) }));
}

function hand(ranks: Rank[], idOffset = 0): Card[] {
  return ranks.map((rank, index) => ({
    id: idOffset + index,
    rank,
    value: valueFromRank(rank),
  }));
}

describe("QA adversarial settlement and deal probes", () => {
  test("player natural 8 beats banker 7 without either hand drawing", () => {
    const initialCards = cards([
      "A", "K", // exposed burn and one face-down burn
      "8", "7", "T", "T", // canonical P, B, P, B initial deal
      ...Array<Rank>(20).fill("K"),
    ]);
    const state = createEngine({ initialCards, shuffle: false, cutOffset: 1 });

    const result = dealRound(state);

    expect(result.playerCards.map((card) => card.rank)).toEqual(["8", "T"]);
    expect(result.bankerCards.map((card) => card.rank)).toEqual(["7", "T"]);
    expect(result.seenThisRound.map((card) => card.rank)).toEqual(["8", "7", "T", "T"]);
    expect(result.settlement.playerTotal).toBe(8);
    expect(result.settlement.bankerTotal).toBe(7);
    expect(result.settlement.outcome).toBe("player");
  });

  test("two-card banker 7 is a normal banker win, never Dragon 7", () => {
    const result = settleHand(hand(["2", "4"]), hand(["3", "4"], 10));

    expect(result.outcome).toBe("banker");
    expect(result.isDragon).toBe(false);
    expect(result.mainPayouts.banker).toBe(1);
    expect(result.mainPayouts.player).toBe(-1);
    expect(result.mainPayouts.tie).toBe(-1);
    expect(result.sidePayouts.dragon).toBe(-1);
    expect(result.sidePayouts.panda).toBe(-1);
  });

  test("winning three-card banker 7 pushes banker and pays Dragon 7 at 40:1", () => {
    const result = settleHand(hand(["2", "4"]), hand(["2", "2", "3"], 10));

    expect(result.outcome).toBe("banker");
    expect(result.isDragon).toBe(true);
    expect(result.mainPayouts.banker).toBe(0);
    expect(result.sidePayouts.dragon).toBe(40);
    expect(result.mainPayouts.player).toBe(-1);
    expect(result.mainPayouts.tie).toBe(-1);
    expect(result.sidePayouts.panda).toBe(-1);
  });

  test("winning three-card player 8 pays player 1:1 and Panda 8 at 25:1", () => {
    const result = settleHand(hand(["A", "5", "2"]), hand(["2", "5"], 10));

    expect(result.outcome).toBe("player");
    expect(result.isPanda).toBe(true);
    expect(result.mainPayouts.player).toBe(1);
    expect(result.sidePayouts.panda).toBe(25);
    expect(result.mainPayouts.banker).toBe(-1);
    expect(result.mainPayouts.tie).toBe(-1);
    expect(result.sidePayouts.dragon).toBe(-1);
  });

  test("tie pays 8:1, pushes both mains, and loses both side bets", () => {
    const result = settleHand(hand(["4", "4"]), hand(["5", "3"], 10));

    expect(result.outcome).toBe("tie");
    expect(result.mainPayouts).toEqual({ player: 0, banker: 0, tie: 8 });
    expect(result.sidePayouts).toEqual({ dragon: -1, panda: -1 });
  });
});

describe("QA burn and decks-remaining probes", () => {
  test("Ace is exposed and seen, exactly one following card is burned unseen", () => {
    const initialCards = buildOrderedDeck();
    initialCards[0] = { id: 0, rank: "A", value: 1 };
    const opened = openShoeWithBurn({ initialCards, shuffle: false });

    expect(opened.exposedBurnCard).toEqual({ id: 0, rank: "A", value: 1 });
    expect(opened.unseenBurnCards.map((card) => card.id)).toEqual([1]);
    expect(opened.unseenBurnCards.some((card) => card.id === opened.exposedBurnCard.id)).toBe(false);
    expect(opened.shoe.nextIndex).toBe(2);
    expect(cardsRemaining(opened.shoe)).toBe(414);
    expect(cardsRemaining(opened.shoe) / 52).toBe(414 / 52);
  });

  test("ten-value exposure burns exactly ten following cards unseen", () => {
    const initialCards = buildOrderedDeck();
    initialCards[0] = { id: 0, rank: "T", value: 10 };
    const opened = openShoeWithBurn({ initialCards, shuffle: false });

    expect(opened.exposedBurnCard.rank).toBe("T");
    expect(burnCountForCard(opened.exposedBurnCard)).toBe(10);
    expect(opened.unseenBurnCards).toHaveLength(10);
    expect(opened.unseenBurnCards.map((card) => card.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(opened.shoe.nextIndex).toBe(11);
    expect(cardsRemaining(opened.shoe)).toBe(405);
    expect(cardsRemaining(opened.shoe) / 52).toBe(405 / 52);
  });
});

interface SeedExpectation {
  seed: string | number;
  burn: Rank;
  player: Rank[];
  banker: Rank[];
  natural: boolean;
  playerDraw: boolean;
  bankerDraw: boolean;
}

const SEED_EXPECTATIONS: SeedExpectation[] = [
  {
    seed: 1,
    burn: "3",
    player: ["K", "T"],
    banker: ["J", "8"],
    natural: true,
    playerDraw: false,
    bankerDraw: false,
  },
  {
    seed: 42,
    burn: "9",
    player: ["T", "2", "8"],
    banker: ["2", "5"],
    natural: false,
    playerDraw: true,
    bankerDraw: false,
  },
  {
    seed: "qa-seed",
    burn: "3",
    player: ["Q", "2", "4"],
    banker: ["4", "6", "7"],
    natural: false,
    playerDraw: true,
    bankerDraw: true,
  },
];

function replayCanonicalFirstRound(expected: SeedExpectation) {
  const shoe = createShoe({
    decks: 8,
    cutOffset: 14,
    rng: createSeededRng(expected.seed),
    shuffle: true,
  });
  const exposedBurnCard = drawCard(shoe);
  for (let index = 0; index < burnCountForCard(exposedBurnCard); index += 1) {
    drawCard(shoe);
  }

  // Replay the physical dealing order independently of dealRound.
  const playerCards = [drawCard(shoe)];
  const bankerCards = [drawCard(shoe)];
  playerCards.push(drawCard(shoe));
  bankerCards.push(drawCard(shoe));

  const playerTotal = baccaratPoint(playerCards);
  const bankerTotal = baccaratPoint(bankerCards);
  const natural = playerTotal >= 8 || bankerTotal >= 8;
  const playerDraw = !natural && shouldPlayerDraw(playerTotal);
  if (playerDraw) playerCards.push(drawCard(shoe));

  const playerThirdValue = playerCards[2] ? playerCards[2].value % 10 : null;
  const bankerDraw = !natural && shouldBankerDraw(bankerTotal, playerThirdValue);
  if (bankerDraw) bankerCards.push(drawCard(shoe));

  return { exposedBurnCard, playerCards, bankerCards, natural, playerDraw, bankerDraw };
}

describe("QA hand-verified seeded tableau replay", () => {
  for (const expected of SEED_EXPECTATIONS) {
    test(`seed ${String(expected.seed)} makes the exact verified draw decisions`, () => {
      const replay = replayCanonicalFirstRound(expected);
      expect(replay.exposedBurnCard.rank).toBe(expected.burn);
      expect(replay.playerCards.map((card) => card.rank)).toEqual(expected.player);
      expect(replay.bankerCards.map((card) => card.rank)).toEqual(expected.banker);
      expect(replay.natural).toBe(expected.natural);
      expect(replay.playerDraw).toBe(expected.playerDraw);
      expect(replay.bankerDraw).toBe(expected.bankerDraw);

      const engine = createEngine({ seed: expected.seed, decks: 8, cutOffset: 14 });
      const actual = dealRound(engine);
      expect(engine.exposedBurnCard.rank).toBe(expected.burn);
      expect(actual.playerCards.map((card) => card.rank)).toEqual(expected.player);
      expect(actual.bankerCards.map((card) => card.rank)).toEqual(expected.banker);
      expect(actual.playerCards.length === 3).toBe(expected.playerDraw);
      expect(actual.bankerCards.length === 3).toBe(expected.bankerDraw);
    });
  }
});

describe("QA cut-card lifecycle probe", () => {
  test("crossing marks the shoe but retirement waits for round finalization", () => {
    const shoe = createShoe({
      initialCards: cards(Array<Rank>(12).fill("A")),
      shuffle: false,
      cutOffset: 7,
    });

    for (let index = 0; index < 4; index += 1) drawCard(shoe);
    expect(shoe.retireAfterCurrentRound).toBe(false);
    expect(shoe.retired).toBe(false);

    drawCard(shoe); // nextIndex reaches cutIndex here
    expect(shoe.retireAfterCurrentRound).toBe(true);
    expect(shoe.retired).toBe(false);

    expect(() => drawCard(shoe)).not.toThrow(); // finish the crossing round
    expect(shoe.retired).toBe(false);

    finalizeRound(shoe);
    expect(shoe.retireAfterCurrentRound).toBe(false);
    expect(shoe.retired).toBe(true);
    expect(() => drawCard(shoe)).toThrow("shoe already retired");
  });
});
