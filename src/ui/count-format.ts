export function signed(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value)}`;
}

export function trueCount(value: number): string {
  // Do not let the presentation cross a betting threshold before the
  // authoritative, unrounded engine value does. For example, 3.96 must stay
  // 3.9 while the exact value remains below the Dragon 7 threshold of 4.
  const truncated = Math.trunc(value * 10) / 10;
  return `${Object.is(truncated, -0) || truncated >= 0 ? "" : "−"}${Math.abs(truncated).toFixed(1)}`;
}

/** Formats a non-negative threshold distance conservatively at one decimal. */
export function thresholdDistance(value: number): string {
  // The tiny allowance absorbs binary representations such as
  // 10.899999999999999 without ever rounding a genuine fractional tenth down.
  const scaled = value * 10;
  const allowance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 16;
  const roundedUp = Math.ceil(scaled - allowance) / 10;
  return Math.max(0, roundedUp).toFixed(1);
}

export function decks(value: number): string { return value.toFixed(2); }

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export function countWord(value: number): string { return WORDS[value] ?? String(value); }
export function rankList(ranks: readonly string[]): string { return ranks.join(", "); }

export function spokenSigned(value: number): string {
  return value === 0 ? "zero" : `${value > 0 ? "plus" : "minus"} ${Math.abs(value)}`;
}
