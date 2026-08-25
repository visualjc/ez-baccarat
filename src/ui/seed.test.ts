import { describe, expect, test } from "bun:test";

import { formatSeedChip, fromLocation } from "./seed";

describe("seed parsing", () => {
  test("reads and trims the seed query parameter", () => {
    expect(fromLocation("?seed=qa-seed")).toBe("qa-seed");
    expect(fromLocation("?shoe=1&seed=%20table-7%20")).toBe("table-7");
  });

  test("returns undefined for missing or blank seeds", () => {
    expect(fromLocation("?shoe=1")).toBeUndefined();
    expect(fromLocation("?seed=%20%20")).toBeUndefined();
  });
});

describe("seed chip formatting", () => {
  test("uses RANDOM for empty and shortens explicit seeds to four characters", () => {
    expect(formatSeedChip()).toBe("RANDOM");
    expect(formatSeedChip("a3f9b1")).toBe("SEED a3f9");
  });
});
