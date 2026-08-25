export type Seat = "player" | "banker";
export type BetKind = "player" | "banker" | "tie" | "dragon" | "panda";
export type GameMode = "trainer" | "casino";

export type BetTotals = Record<BetKind, number>;
export type BetHistory = Record<BetKind, number[]>;

export const CHIP_DENOMS = [1, 5, 25, 100, 500, 1000] as const;
export const BET_ORDER: BetKind[] = ["panda", "player", "tie", "banker", "dragon"];

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function formatNet(value: number): string {
  const absolute = formatCurrency(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return absolute;
}
