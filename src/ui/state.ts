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

export type DoubleSource = "current" | "last" | "none";

export interface DoublePlan {
  ok: boolean;
  source: DoubleSource;
  /** The layout to apply when ok; an empty history otherwise. */
  history: BetHistory;
  /** What the doubled layout costs, affordable or not. */
  total: number;
  reason?: "no-wagers" | "bankroll";
}

/** Each spot's chip list concatenated with itself: exact 2x, no re-denomination. */
export function doubleBetHistory(history: BetHistory): BetHistory {
  const source = cloneBetHistory(history);
  return {
    player: [...source.player, ...source.player],
    banker: [...source.banker, ...source.banker],
    tie: [...source.tie, ...source.tie],
    dragon: [...source.dragon, ...source.dragon],
    panda: [...source.panda, ...source.panda],
  };
}

/**
 * 2x doubles the live layout. On an empty layout it doubles the last settled
 * one instead — the round clears the felt before it settles, so an empty
 * layout is the state a player reaches for 2x from after every round.
 */
export function planDoubleWager(
  bankroll: number,
  current: BetHistory,
  last?: BetHistory,
): DoublePlan {
  const fromCurrent = totalWager(current) > 0;
  const previous = last ? cloneBetHistory(last) : undefined;
  const source: DoubleSource = fromCurrent
    ? "current"
    : previous && totalWager(previous) > 0
      ? "last"
      : "none";

  if (source === "none") {
    return { ok: false, source, history: createEmptyBetHistory(), total: 0, reason: "no-wagers" };
  }

  const doubled = doubleBetHistory(source === "current" ? current : previous!);
  const total = totalWager(doubled);

  // Refused, never clamped: a partial double would silently change which side
  // the player is backing, and a button labelled 2x that does not double lies.
  if (total > bankroll) {
    return { ok: false, source, history: createEmptyBetHistory(), total, reason: "bankroll" };
  }

  return { ok: true, source, history: doubled, total };
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
