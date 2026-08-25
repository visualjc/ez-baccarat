export function fromLocation(value?: string): string | undefined {
  if (value === undefined && typeof window === "undefined") {
    return undefined;
  }

  const source = value ?? window.location.search;
  const parsed = new URLSearchParams(source);
  const raw = parsed.get("seed");

  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function formatSeedChip(seed?: string): string {
  if (!seed) {
    return "RANDOM";
  }

  return `SEED ${seed.slice(0, 4)}`;
}
