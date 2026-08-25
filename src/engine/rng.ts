export type RandomGenerator = () => number;

function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}

function mulberry32(seed: number): RandomGenerator {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let a = t;
    a = Math.imul(a ^ (a >>> 15), 1 | a);
    a ^= a + Math.imul(a ^ (a >>> 7), 61 | a);
    const out = ((a ^ (a >>> 14)) >>> 0) / 4294967296;
    return out;
  };
}

export function createSeededRng(seed: string | number): RandomGenerator {
  const normalizedSeed = typeof seed === "number" ? seed >>> 0 : xmur3(seed);
  return mulberry32(normalizedSeed);
}
