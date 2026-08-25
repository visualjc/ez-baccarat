import { Card, Rank, RANKS } from "./card";

export const DEFAULT_SHOE_SIZE = 416;
export const DRAGON_COUNT_THRESHOLD = 4;
export const PANDA_COUNT_THRESHOLD = 11;

export const DRAGON_TAG_TABLE: Record<Rank, number> = {
  "4": -1,
  "5": -1,
  "6": -1,
  "7": -1,
  "8": 2,
  "9": 2,
  A: 0,
  "2": 0,
  "3": 0,
  T: 0,
  J: 0,
  Q: 0,
  K: 0,
};

export const PANDA_TAG_TABLE: Record<Rank, number> = {
  T: 1,
  J: 1,
  Q: 1,
  K: 1,
  A: 1,
  "2": 1,
  "3": -2,
  "4": -2,
  "5": -2,
  "6": -1,
  "7": -1,
  "8": -2,
  "9": 4,
};

export interface CountState {
  dragonRunning: number;
  pandaRunning: number;
  seenCount: number;
  decksRemaining: number;
}

export interface CountSignal {
  running: number;
  true: number;
  signal: boolean;
}

export interface CountPairSignal {
  dragon: CountSignal;
  panda: CountSignal;
}

export interface CountCardTrace {
  rank: Rank;
  dragonTag: number;
  pandaTag: number;
}

export interface CountRoundTrace {
  cards: CountCardTrace[];
  before: CountPairSignal;
  after: CountPairSignal;
}

export interface CountRoundResult {
  state: CountState;
  trace: CountRoundTrace;
}

function unseenCardsFromState(seenCount: number, totalCards: number): number {
  return Math.max(totalCards - seenCount, 0);
}

function decksRemainingFromState(seenCount: number, totalCards: number): number {
  return unseenCardsFromState(seenCount, totalCards) / 52;
}

function normalizeState(state: CountState, totalCards: number): CountState {
  const seenCount = Math.max(0, Math.floor(state.seenCount));
  return {
    dragonRunning: state.dragonRunning,
    pandaRunning: state.pandaRunning,
    seenCount,
    decksRemaining: decksRemainingFromState(seenCount, totalCards),
  };
}

export function createInitialCountState(totalCards = DEFAULT_SHOE_SIZE): CountState {
  return {
    dragonRunning: 0,
    pandaRunning: 0,
    seenCount: 0,
    decksRemaining: decksRemainingFromState(0, totalCards),
  };
}

export function dragonTagForRank(rank: Rank): number {
  return DRAGON_TAG_TABLE[rank];
}

export function pandaTagForRank(rank: Rank): number {
  return PANDA_TAG_TABLE[rank];
}

function runningToTrue(running: number, decksRemaining: number): number {
  if (decksRemaining <= 0) {
    return running;
  }
  return running / decksRemaining;
}

export function isDragonBetSignal(trueCount: number): boolean {
  return trueCount >= DRAGON_COUNT_THRESHOLD;
}

export function isPandaBetSignal(trueCount: number): boolean {
  return trueCount >= PANDA_COUNT_THRESHOLD;
}

function stateSignal(state: Pick<CountState, "dragonRunning" | "pandaRunning" | "seenCount">, totalCards: number): CountPairSignal {
  const decksRemaining = decksRemainingFromState(state.seenCount, totalCards);
  const dragonTrue = runningToTrue(state.dragonRunning, decksRemaining);
  const pandaTrue = runningToTrue(state.pandaRunning, decksRemaining);

  return {
    dragon: {
      running: state.dragonRunning,
      true: dragonTrue,
      signal: isDragonBetSignal(dragonTrue),
    },
    panda: {
      running: state.pandaRunning,
      true: pandaTrue,
      signal: isPandaBetSignal(pandaTrue),
    },
  };
}

export function traceRoundCards(cards: readonly Card[]): CountCardTrace[] {
  return cards.map((card) => ({
    rank: card.rank,
    dragonTag: dragonTagForRank(card.rank),
    pandaTag: pandaTagForRank(card.rank),
  }));
}

export function advanceRoundCountState(
  state: CountState,
  seenThisRound: readonly Card[],
  totalCards = DEFAULT_SHOE_SIZE,
): CountRoundResult {
  const before = normalizeState(state, totalCards);
  const beforeSignal = stateSignal(before, totalCards);
  let dragonRunning = before.dragonRunning;
  let pandaRunning = before.pandaRunning;

  for (const card of seenThisRound) {
    dragonRunning += dragonTagForRank(card.rank);
    pandaRunning += pandaTagForRank(card.rank);
  }

  const seenCount = before.seenCount + seenThisRound.length;
  const after: CountState = {
    dragonRunning,
    pandaRunning,
    seenCount,
    decksRemaining: decksRemainingFromState(seenCount, totalCards),
  };

  return {
    state: after,
    trace: {
      cards: traceRoundCards(seenThisRound),
      before: beforeSignal,
      after: stateSignal(after, totalCards),
    },
  };
}

export function validateTagTables(): boolean {
  if (RANKS.length !== Object.keys(DRAGON_TAG_TABLE).length) {
    return false;
  }
  return RANKS.every((rank) =>
    Number.isInteger(DRAGON_TAG_TABLE[rank]) && Number.isInteger(PANDA_TAG_TABLE[rank]),
  );
}

