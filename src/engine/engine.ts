import { Card } from "./card";
import {
  advanceRoundCountState,
  CountPairSignal,
  CountState,
  createInitialCountState,
} from "./counts";
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
  seenThisRoundForCounts: Card[];
  settlement: ReturnType<typeof settleHand>;
  cutCardReachedDuringRound: boolean;
  shoeRetiredAfterRound: boolean;
  /** Engine-owned display values; UI must not replay baccarat/tableau math. */
  presentation: {
    playerRunningTotals: number[];
    bankerRunningTotals: number[];
    playerThirdNarration?: string;
    bankerThirdNarration?: string;
  };
}

export interface EngineState {
  shoe: Shoe;
  roundsPlayed: number;
  exposedBurnCard: Card;
  unseenBurnCards: Card[];
  countState: CountState;
  countSignals: CountPairSignal;
}

export function createEngine(options: EngineOptions = {}): EngineState {
  const rng = resolveRng(options.seed);
  const optionsWithRng = {
    ...options,
    rng,
    shuffle: options.shuffle ?? true,
  };

  const opened = openShoeWithBurn(optionsWithRng);
  const openingCount = advanceRoundCountState(
    createInitialCountState(opened.shoe.cards.length),
    [opened.exposedBurnCard],
    opened.shoe.cards.length,
  );

  return {
    shoe: opened.shoe,
    roundsPlayed: 0,
    exposedBurnCard: opened.exposedBurnCard,
    unseenBurnCards: opened.unseenBurnCards,
    countState: openingCount.state,
    countSignals: openingCount.trace.after,
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

  const playerFirst = drawCard(state.shoe);
  const bankerFirst = drawCard(state.shoe);
  const playerSecond = drawCard(state.shoe);
  const bankerSecond = drawCard(state.shoe);

  playerCards.push(playerFirst, playerSecond);
  bankerCards.push(bankerFirst, bankerSecond);
  seenThisRound.push(playerFirst, bankerFirst, playerSecond, bankerSecond);

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
  const playerRunningTotals = playerCards.map((_, index) => baccaratPoint(playerCards.slice(0, index + 1)));
  const bankerRunningTotals = bankerCards.map((_, index) => baccaratPoint(bankerCards.slice(0, index + 1)));
  const playerThirdNarration = playerCards.length === 3
    ? `Player ${playerTotal} draws on 0-5`
    : undefined;
  const bankerThirdNarration = bankerCards.length === 3
    ? playerCards.length === 3
      ? `Banker ${bankerTotal} draws vs Player third ${playerCards[2]!.value % 10}`
      : `Banker ${bankerTotal} draws with Player standing`
    : undefined;
  const seenThisRoundForCounts = state.roundsPlayed === 0
    ? [state.exposedBurnCard, ...seenThisRound]
    : seenThisRound;
  const roundCount = advanceRoundCountState(
    state.countState,
    seenThisRound,
    state.shoe.cards.length,
  );
  const cutCardReachedDuringRound = state.shoe.retireAfterCurrentRound;
  finalizeRound(state.shoe);

  state.countState = roundCount.state;
  state.countSignals = roundCount.trace.after;
  state.roundsPlayed += 1;

  return {
    playerCards,
    bankerCards,
    seenThisRound,
    seenThisRoundForCounts,
    settlement,
    cutCardReachedDuringRound,
    shoeRetiredAfterRound: state.shoe.retired,
    presentation: {
      playerRunningTotals,
      bankerRunningTotals,
      playerThirdNarration,
      bankerThirdNarration,
    },
  };
}
