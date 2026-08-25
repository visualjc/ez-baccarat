import { describe, expect, test } from "bun:test";
import { Card, RANKS, buildOrderedDeck, valueFromRank } from "./card";
import { createEngine, dealRound, EngineState } from "./engine";
import {
  baccaratPoint,
  shouldBankerDraw,
  settleHand,
  shouldPlayerDraw,
} from "./rules";
import { createSeededRng } from "./rng";
import {
  burnCountForCard,
  cardsRemaining,
  createShoe,
  openShoeWithBurn,
} from "./shoe";

function makeCardsFromRanks(ranks: string[], startId = 0): Card[] {
  return ranks.map((rank, index) => ({
    id: startId + index,
    rank: rank as Card["rank"],
    value: valueFromRank(rank as Card["rank"]),
  }));
}

function runRounds(state: EngineState, rounds: number) {
  const transcript = [];
  for (let i = 0; i < rounds; i++) {
    const result = dealRound(state);
    transcript.push({
      playerCards: result.playerCards.map((card) => card.id),
      bankerCards: result.bankerCards.map((card) => card.id),
      outcome: result.settlement.outcome,
      dragon: result.settlement.isDragon,
      panda: result.settlement.isPanda,
      cutCardReachedDuringRound: result.cutCardReachedDuringRound,
      shoeRetiredAfterRound: result.shoeRetiredAfterRound,
    });
    if (state.shoe.retired) {
      break;
    }
  }
  return transcript;
}

describe("cards", () => {
  test("builds an 8-deck shoe and preserves rank totals", () => {
    const deck = buildOrderedDeck();
    expect(deck).toHaveLength(416);
    const byRank = deck.reduce<Record<string, number>>((acc, card) => {
      acc[card.rank] = (acc[card.rank] ?? 0) + 1;
      return acc;
    }, {});
    for (const rank of RANKS) {
      expect(byRank[rank]).toBe(32);
    }
  });
});

describe("rng", () => {
  test("creates deterministic seeded shoe order", () => {
    const rngA = createSeededRng("same-seed");
    const rngB = createSeededRng("same-seed");
    const shoeA = createShoe({ decks: 4, rng: rngA, shuffle: true });
    const shoeB = createShoe({ decks: 4, rng: rngB, shuffle: true });
    expect(shoeA.cards.map((card) => card.id)).toEqual(shoeB.cards.map((card) => card.id));
  });
});

describe("shoe burn", () => {
  test("exposes first card and burns unseen cards", () => {
    const customDeck = makeCardsFromRanks([
      "A",
      "4",
      "6",
      "7",
      "8",
      "9",
      "T",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);

    const opened = openShoeWithBurn({
      initialCards: customDeck,
      decks: 1,
      shuffle: false,
      cutOffset: 0.1,
    });
    expect(opened.exposedBurnCard.rank).toBe("A");
    expect(opened.unseenBurnCards).toHaveLength(1);
    expect(opened.unseenBurnCards[0].id).toBe(1);
    expect(cardsRemaining(opened.shoe)).toBe(10);
  });

  test("uses baccarat burn arithmetic for exposed card values", () => {
    const ace = makeCardsFromRanks(["A"])[0];
    const five = makeCardsFromRanks(["5"], 1)[0];
    const ten = makeCardsFromRanks(["T"], 2)[0];
    expect(burnCountForCard(ace)).toBe(1);
    expect(burnCountForCard(five)).toBe(5);
    expect(burnCountForCard(ten)).toBe(10);
  });
});

describe("tableau", () => {
  test("is exhaustively coded for player-third-by-banker-total cells", () => {
    const expected: Record<number, number[]> = {
      0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      3: [0, 1, 2, 3, 4, 5, 6, 7, 9],
      4: [2, 3, 4, 5, 6, 7],
      5: [4, 5, 6, 7],
      6: [6, 7],
      7: [],
      8: [],
      9: [],
    };

    for (let bankerTotal = 0; bankerTotal <= 9; bankerTotal++) {
      for (let playerThird = 0; playerThird <= 9; playerThird++) {
        const shouldDraw = shouldBankerDraw(bankerTotal, playerThird);
        expect(shouldDraw).toBe(expected[bankerTotal]!.includes(playerThird));
      }
    }
  });

  test("banker follows player rule when player stands", () => {
    for (let bankerTotal = 0; bankerTotal <= 9; bankerTotal++) {
      expect(shouldBankerDraw(bankerTotal, null)).toBe(bankerTotal <= 5);
    }
  });
});

describe("settlement", () => {
  test("applies main/side outcomes for every flag path", () => {
    const baseCards: Card[] = [
      { id: 1, rank: "A", value: 1 },
      { id: 2, rank: "2", value: 2 },
    ];

    const playerWin = settleHand(
      [
        { ...baseCards[0], id: 3 },
        { id: 4, rank: "5", value: 5 },
        { id: 5, rank: "2", value: 2 },
      ],
      [{ ...baseCards[0], id: 6 }, { id: 7, rank: "5", value: 5 }],
    );
    expect(playerWin.outcome).toBe("player");
    expect(playerWin.isPanda).toBe(true);
    expect(playerWin.mainPayouts.player).toBe(1);

    const bankerDragon = settleHand(
      [{ id: 1, rank: "4", value: 4 }, { id: 2, rank: "6", value: 6 }],
      [
        { id: 3, rank: "2", value: 2 },
        { id: 4, rank: "2", value: 2 },
        { id: 5, rank: "3", value: 3 },
      ],
    );
    expect(bankerDragon.outcome).toBe("banker");
    expect(bankerDragon.isDragon).toBe(true);
    expect(bankerDragon.mainPayouts.banker).toBe(0);
    expect(bankerDragon.sidePayouts.dragon).toBe(40);

    const tie = settleHand(
      [{ id: 1, rank: "4", value: 4 }, { id: 2, rank: "4", value: 4 }],
      [{ id: 3, rank: "5", value: 5 }, { id: 4, rank: "3", value: 3 }],
    );
    expect(tie.outcome).toBe("tie");
    expect(tie.mainPayouts.tie).toBe(8);
    expect(tie.mainPayouts.player).toBe(0);
    expect(tie.mainPayouts.banker).toBe(0);
    expect(tie.isDragon).toBe(false);
    expect(tie.isPanda).toBe(false);
  });
});

describe("engine replay", () => {
  test("replays deterministically with seeded mode", () => {
    const options = { seed: 99, decks: 2, cutOffset: 14 };
    const engineA = createEngine(options);
    const engineB = createEngine(options);

    const transcriptA = runRounds(engineA, 3);
    const transcriptB = runRounds(engineB, 3);

    expect(transcriptA).toEqual(transcriptB);
  });
});

describe("shoe lifecycle", () => {
  test("retirement occurs only after a round that crosses cut card", () => {
    const deck = makeCardsFromRanks([
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
    ]);
    const state = createEngine({
      initialCards: deck,
      cutOffset: 14,
      shuffle: false,
      decks: 1,
    });

    const firstRound = dealRound(state);
    expect(firstRound.cutCardReachedDuringRound).toBe(true);
    expect(firstRound.shoeRetiredAfterRound).toBe(true);
    expect(() => dealRound(state)).toThrow("shoe retired");
  });
});
