import { Card } from "./card";
import { RandomGenerator, createSeededRng } from "./rng";
import { drawCard, finalizeRound, openShoeWithBurn, Shoe } from "./shoe";
import { baccaratPoint, shouldBankerDraw, shouldPlayerDraw, settleHand } from "./rules";

export interface EngineOptions {
  seed?: string | number;
  decks?: number;
  cutOffset?: number;
  shuffle?: boolean;
  initialCards?: Card[];
}

export interface RoundResult {
  playerCards: Card[];
  bankerCards: Card[];
  seenThisRound: Card[];
  settlement: ReturnType<typeof settleHand>;
  cutCardReachedDuringRound: boolean;
  shoeRetiredAfterRound: boolean;
}

export interface EngineState {
  shoe: Shoe;
  roundsPlayed: number;
  exposedBurnCard: Card;
  unseenBurnCards: Card[];
}

export function createEngine(options: EngineOptions = {}): EngineState {
  const rng = resolveRng(options.seed);
  const optionsWithRng = {
    ...options,
    rng,
    shuffle: options.shuffle ?? true,
  };

  const opened = openShoeWithBurn(optionsWithRng);

  return {
    shoe: opened.shoe,
    roundsPlayed: 0,
    exposedBurnCard: opened.exposedBurnCard,
    unseenBurnCards: opened.unseenBurnCards,
  };
}

function resolveRng(seed?: string | number): RandomGenerator | undefined {
  if (seed === undefined) {
    return undefined;
  }
  return createSeededRng(seed);
}

export function dealRound(state: EngineState): RoundResult {
  if (state.shoe.retired) {
    throw new Error("shoe retired");
  }

  const playerCards: Card[] = [];
  const bankerCards: Card[] = [];
  const seenThisRound: Card[] = [];

  playerCards.push(drawCard(state.shoe));
  playerCards.push(drawCard(state.shoe));
  bankerCards.push(drawCard(state.shoe));
  bankerCards.push(drawCard(state.shoe));
  seenThisRound.push(
    ...playerCards,
    ...bankerCards,
  );

  const playerTotal = baccaratPoint(playerCards);
  const bankerTotal = baccaratPoint(bankerCards);
  const initialCardsAreNatural = playerTotal >= 8 || bankerTotal >= 8;

  if (!initialCardsAreNatural && shouldPlayerDraw(playerTotal)) {
    const playerThird = drawCard(state.shoe);
    playerCards.push(playerThird);
    seenThisRound.push(playerThird);
  }

  if (!initialCardsAreNatural) {
    const playerThirdValue = playerCards[2]
      ? baccaratPoint([playerCards[2]]) % 10
      : null;

    if (shouldBankerDraw(bankerTotal, playerCards[2] ? playerThirdValue : null)) {
      const bankerThird = drawCard(state.shoe);
      bankerCards.push(bankerThird);
      seenThisRound.push(bankerThird);
    }
  }

  const settlement = settleHand(playerCards, bankerCards);
  const cutCardReachedDuringRound = state.shoe.retireAfterCurrentRound;
  finalizeRound(state.shoe);

  state.roundsPlayed += 1;

  return {
    playerCards,
    bankerCards,
    seenThisRound,
    settlement,
    cutCardReachedDuringRound,
    shoeRetiredAfterRound: state.shoe.retired,
  };
}
