import { Card } from "./card";

export type Outcome = "player" | "banker" | "tie";

export interface Settlement {
  outcome: Outcome;
  playerTotal: number;
  bankerTotal: number;
  isDragon: boolean;
  isPanda: boolean;
  mainPayouts: {
    player: number;
    banker: number;
    tie: number;
  };
  sidePayouts: {
    dragon: number;
    panda: number;
  };
}

export function baccaratPoint(cards: readonly Card[]): number {
  return cards.reduce((sum, card) => sum + card.value, 0) % 10;
}

export function shouldPlayerDraw(playerTotal: number): boolean {
  return playerTotal <= 5;
}

export function shouldBankerDraw(
  bankerTotal: number,
  playerThirdValue: number | null,
): boolean {
  if (playerThirdValue === null) {
    return bankerTotal <= 5;
  }

  if (bankerTotal <= 2) {
    return true;
  }
  if (bankerTotal === 3) {
    return playerThirdValue !== 8;
  }
  if (bankerTotal === 4) {
    return playerThirdValue >= 2 && playerThirdValue <= 7;
  }
  if (bankerTotal === 5) {
    return playerThirdValue >= 4 && playerThirdValue <= 7;
  }
  if (bankerTotal === 6) {
    return playerThirdValue >= 6 && playerThirdValue <= 7;
  }
  return false;
}

export function settleHand(playerCards: readonly Card[], bankerCards: readonly Card[]): Settlement {
  const playerTotal = baccaratPoint(playerCards);
  const bankerTotal = baccaratPoint(bankerCards);

  const isPlayerWin = playerTotal > bankerTotal;
  const isBankerWin = bankerTotal > playerTotal;
  const isTie = playerTotal === bankerTotal;

  const isDragon = isBankerWin && bankerCards.length === 3 && bankerTotal === 7;
  const isPanda = isPlayerWin && playerCards.length === 3 && playerTotal === 8;

  let outcome: Outcome;
  if (isTie) {
    outcome = "tie";
  } else if (isPlayerWin) {
    outcome = "player";
  } else {
    outcome = "banker";
  }

  const playerMainPayout = isPlayerWin ? 1 : isTie ? 0 : -1;
  const bankerMainPayout = isDragon
    ? 0
    : isBankerWin
      ? 1
      : isTie
        ? 0
        : -1;
  const tieMainPayout = isTie ? 8 : -1;
  const dragonSidePayout = isDragon ? 40 : -1;
  const pandaSidePayout = isPanda ? 25 : -1;

  return {
    outcome,
    playerTotal,
    bankerTotal,
    isDragon,
    isPanda,
    mainPayouts: {
      player: playerMainPayout,
      banker: bankerMainPayout,
      tie: tieMainPayout,
    },
    sidePayouts: {
      dragon: dragonSidePayout,
      panda: pandaSidePayout,
    },
  };
}
