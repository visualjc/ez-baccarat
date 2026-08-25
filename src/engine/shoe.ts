import { buildOrderedDeck, Card } from "./card";
import { RandomGenerator } from "./rng";

export interface ShoeOptions {
  decks?: number;
  cutOffset?: number;
  rng?: RandomGenerator;
  shuffle?: boolean;
  initialCards?: Card[];
}

export interface Shoe {
  cards: Card[];
  nextIndex: number;
  cutIndex: number;
  retireAfterCurrentRound: boolean;
  retired: boolean;
}

export interface OpenedShoe {
  shoe: Shoe;
  exposedBurnCard: Card;
  unseenBurnCards: Card[];
}

const DEFAULT_CUT_OFFSET = 14;
const DEFAULT_DECKS = 8;

function shuffle<T>(items: T[], rng: RandomGenerator): void {
  for (let i = items.length - 1; i > 0; i--) {
    const swapWith = Math.floor(rng() * (i + 1));
    const tmp = items[i];
    items[i] = items[swapWith];
    items[swapWith] = tmp;
  }
}

export function createShoe(options: ShoeOptions = {}): Shoe {
  const {
    decks = DEFAULT_DECKS,
    cutOffset = DEFAULT_CUT_OFFSET,
    rng,
    shuffle: shouldShuffle = true,
    initialCards,
  } = options;

  const cards = initialCards
    ? initialCards.map((card, index) => ({ ...card, id: index }))
    : buildOrderedDeck(decks);

  if (shouldShuffle && rng) {
    shuffle(cards, rng);
  } else if (shouldShuffle && !rng) {
    shuffle(cards, Math.random);
  }

  const clampedCutOffset = Math.max(1, Math.min(cutOffset, cards.length));
  const cutIndex = Math.max(0, cards.length - clampedCutOffset);

  return {
    cards,
    nextIndex: 0,
    cutIndex,
    retireAfterCurrentRound: false,
    retired: false,
  };
}

export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length - shoe.nextIndex;
}

export function drawCard(shoe: Shoe): Card {
  if (shoe.retired) {
    throw new Error("shoe already retired");
  }
  if (shoe.nextIndex >= shoe.cards.length) {
    throw new Error("shoe depleted");
  }

  const card = shoe.cards[shoe.nextIndex];
  shoe.nextIndex += 1;

  if (shoe.nextIndex >= shoe.cutIndex) {
    shoe.retireAfterCurrentRound = true;
  }

  return card;
}

export function burnCountForCard(card: Card): number {
  return card.value === 10 ? 10 : Math.max(1, card.value);
}

export function openShoeWithBurn(options: ShoeOptions = {}): OpenedShoe {
  const shoe = createShoe({ ...options });
  const exposedBurnCard = drawCard(shoe);
  const burnCount = burnCountForCard(exposedBurnCard);
  const unseenBurnCards: Card[] = [];

  for (let i = 0; i < burnCount; i++) {
    unseenBurnCards.push(drawCard(shoe));
  }

  return {
    shoe,
    exposedBurnCard,
    unseenBurnCards,
  };
}

export function finalizeRound(shoe: Shoe): void {
  if (shoe.retireAfterCurrentRound) {
    shoe.retired = true;
    shoe.retireAfterCurrentRound = false;
  }
}
