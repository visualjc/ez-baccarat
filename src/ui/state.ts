import type { Settlement } from "../engine/rules";
import type { BetHistory, BetKind } from "./types";

export const DEFAULT_BANKROLL = 1000;

export function createEmptyBetHistory(): BetHistory {
  return {
    player: [],
    banker: [],
    tie: [],
    dragon: [],
    panda: [],
  };
}

export function cloneBetHistory(history?: Partial<BetHistory>): BetHistory {
  const base = createEmptyBetHistory();
  if (!history) {
    return base;
  }

  return {
    player: [...(history.player ?? base.player)],
    banker: [...(history.banker ?? base.banker)],
    tie: [...(history.tie ?? base.tie)],
    dragon: [...(history.dragon ?? base.dragon)],
    panda: [...(history.panda ?? base.panda)],
  };
}

export function totalForBet(history: BetHistory, kind: BetKind): number {
  return history[kind].reduce((sum, amount) => sum + amount, 0);
}

export function totalWager(history: BetHistory): number {
  return totalForBet(history, "player")
    + totalForBet(history, "banker")
    + totalForBet(history, "tie")
    + totalForBet(history, "dragon")
    + totalForBet(history, "panda");
}

export function canPlaceChip(bankroll: number, history: BetHistory, amount: number): boolean {
  return amount > 0 && totalWager(history) + amount <= bankroll;
}

export function placeChip(history: BetHistory, kind: BetKind, amount: number): BetHistory {
  const next = cloneBetHistory(history);
  next[kind].push(amount);
  return next;
}

export function removeLastChip(history: BetHistory, kind: BetKind): { history: BetHistory; removed?: number } {
  const next = cloneBetHistory(history);
  const removed = next[kind].pop();

  return {
    history: next,
    removed,
  };
}

export function canRestoreHistory(bankroll: number, history?: Partial<BetHistory>): boolean {
  if (!history) {
    return false;
  }
  return totalWager(cloneBetHistory(history)) <= bankroll;
}

export function computeBetMultipliers(
  history: BetHistory,
  settlement: Settlement,
): Partial<Record<BetKind, number>> {
  const multipliers: Partial<Record<BetKind, number>> = {};

  if (history.player.length > 0) {
    multipliers.player = settlement.mainPayouts.player;
  }
  if (history.banker.length > 0) {
    multipliers.banker = settlement.mainPayouts.banker;
  }
  if (history.tie.length > 0) {
    multipliers.tie = settlement.mainPayouts.tie;
  }
  if (history.dragon.length > 0) {
    multipliers.dragon = settlement.sidePayouts.dragon;
  }
  if (history.panda.length > 0) {
    multipliers.panda = settlement.sidePayouts.panda;
  }

  return multipliers;
}

export function settlementNet(history: BetHistory, settlement: Settlement): number {
  const multipliers = computeBetMultipliers(history, settlement);

  return Object.entries(multipliers).reduce((sum, [kind, multiplier]) => {
    const wager = totalForBet(history, kind as BetKind);
    return sum + wager * (multiplier ?? 0);
  }, 0);
}

export function applyBankrollDelta(bankroll: number, delta: number): number {
  const next = Math.round(bankroll + delta);
  if (next < 0) {
    throw new Error(`Bankroll invariant violated: ${bankroll} + ${delta} would be ${next}.`);
  }
  return next;
}
