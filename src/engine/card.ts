export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K";

export interface Card {
  id: number;
  rank: Rank;
  value: number;
}

export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];

const VALUE_BY_RANK: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 10,
  Q: 10,
  K: 10,
};

export function valueFromRank(rank: Rank): number {
  return VALUE_BY_RANK[rank];
}

export function buildOrderedDeck(decks = 8): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (let deck = 0; deck < decks; deck++) {
    for (const rank of RANKS) {
      for (let suit = 0; suit < 4; suit++) {
        cards.push({ id: id++, rank, value: VALUE_BY_RANK[rank] });
      }
    }
  }
  return cards;
}
