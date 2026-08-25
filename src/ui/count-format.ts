export function signed(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value)}`;
}

export function trueCount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Object.is(rounded, -0) || rounded >= 0 ? "" : "−"}${Math.abs(rounded).toFixed(1)}`;
}

export function decks(value: number): string { return value.toFixed(2); }

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export function countWord(value: number): string { return WORDS[value] ?? String(value); }
export function rankList(ranks: readonly string[]): string { return ranks.join(", "); }

export function spokenSigned(value: number): string {
  return value === 0 ? "zero" : `${value > 0 ? "plus" : "minus"} ${Math.abs(value)}`;
}
