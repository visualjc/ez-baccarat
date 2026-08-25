import { afterEach, beforeEach, expect, test } from "bun:test";
import type { Rank } from "../engine/card";
import {
  DRAGON_COUNT_THRESHOLD,
  PANDA_COUNT_THRESHOLD,
  isDragonBetSignal,
  isPandaBetSignal,
  type CountCardTrace,
  type CountPairSignal,
  type CountRoundResult,
} from "../engine/counts";
import type { RoundResult } from "../engine/engine";
import { createBus } from "./bus";
import { mountCountPanel } from "./count-panel";

class FakeElement {
  readonly children: FakeElement[] = [];
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  readonly style = { setProperty: () => {} };
  readonly classList = {
    add: (...names: string[]) => { this.className = [...new Set([...this.className.split(" ").filter(Boolean), ...names])].join(" "); },
    remove: (...names: string[]) => { this.className = this.className.split(" ").filter((name) => name && !names.includes(name)).join(" "); },
  };
  className = "";
  textContent = "";
  id = "";
  hidden = false;
  tabIndex = 0;
  open = false;
  offsetWidth = 0;

  constructor(readonly tagName: string) {}
  append(...nodes: FakeElement[]): void { this.children.push(...nodes); }
  replaceChildren(...nodes: FakeElement[]): void { this.children.splice(0, this.children.length, ...nodes); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  toggleAttribute(name: string, force?: boolean): boolean {
    const enabled = force ?? !this.attributes.has(name);
    if (enabled) this.attributes.set(name, ""); else this.attributes.delete(name);
    return enabled;
  }
  addEventListener(): void {}
  remove(): void {}
  scrollIntoView(): void {}
  focus(): void {}
}

const findByClass = (element: FakeElement, className: string): FakeElement => {
  if (element.className.split(" ").includes(className)) return element;
  for (const child of element.children) {
    try { return findByClass(child, className); } catch { /* search the next branch */ }
  }
  throw new Error(`Missing .${className}`);
};
const allByClass = (element: FakeElement, className: string): FakeElement[] => [
  ...(element.className.split(" ").includes(className) ? [element] : []),
  ...element.children.flatMap((child) => allByClass(child, className)),
];
const block = (root: FakeElement, system: "dragon" | "panda") => allByClass(root, "count-block").find((item) => item.dataset.bet === system)!;
const card = (rank: Rank, dragonTag: number, pandaTag: number, dragonRunningAfter: number, pandaRunningAfter: number): CountCardTrace => ({ rank, dragonTag, pandaTag, dragonRunningAfter, pandaRunningAfter });

function signals(dragonRunning: number, dragonTrue: number, pandaRunning: number, pandaTrue: number): CountPairSignal {
  return {
    dragon: { running: dragonRunning, true: dragonTrue, signal: isDragonBetSignal(dragonTrue) },
    panda: { running: pandaRunning, true: pandaTrue, signal: isPandaBetSignal(pandaTrue) },
  };
}

function counts(cards: CountCardTrace[], before: CountPairSignal, after: CountPairSignal): CountRoundResult {
  return {
    state: { dragonRunning: after.dragon.running, pandaRunning: after.panda.running, seenCount: 1 + cards.length, decksRemaining: 7.5 },
    trace: { cards, before, after },
  };
}

function settled(result: CountRoundResult): RoundResult {
  return { counts: result } as RoundResult;
}

let priorDocument: typeof document | undefined;
let priorWindow: typeof window | undefined;

beforeEach(() => {
  priorDocument = globalThis.document;
  priorWindow = globalThis.window;
  Object.assign(globalThis, {
    document: { createElement: (tag: string) => new FakeElement(tag) },
    window: { addEventListener: () => {}, removeEventListener: () => {} },
  });
});

afterEach(() => {
  Object.assign(globalThis, { document: priorDocument, window: priorWindow });
});

test("maps exact signal states to conservative Dragon and Panda displays and captions", () => {
  const bus = createBus();
  const host = new FakeElement("div");
  const panel = mountCountPanel(host as unknown as HTMLElement, bus);
  const root = panel.element as unknown as FakeElement;
  const boundaries = [
    [3.96, 10.96, "3.9", "0.1 to go", "10.9", "0.1 to go"],
    [3.99, 10.99, "3.9", "0.1 to go", "10.9", "0.1 to go"],
    [4.0, 11.0, "4.0", "+0.0 over", "11.0", "+0.0 over"],
    [4.04, 11.04, "4.0", "+0.1 over", "11.0", "+0.1 over"],
  ] as const;

  for (const [dragonTrue, pandaTrue, dragonDisplay, dragonCaption, pandaDisplay, pandaCaption] of boundaries) {
    const before = signals(0, 0, 0, 0);
    const after = signals(21, dragonTrue, 52, pandaTrue);
    bus.emit({ type: "round:settled", result: settled(counts([], before, after)), cardsRemaining: 300 });
    const dragon = block(root, "dragon"); const panda = block(root, "panda");
    expect(findByClass(dragon, "count-true").textContent).toBe(dragonDisplay);
    expect(findByClass(dragon, "signal-pill").textContent).toBe(dragonTrue >= DRAGON_COUNT_THRESHOLD ? "✓ BET" : "· NO BET");
    expect(findByClass(dragon, "threshold-caption").textContent).toBe(`${dragonTrue >= DRAGON_COUNT_THRESHOLD ? "true" : "needs true"} ≥ +4 · ${dragonCaption}`);
    expect(findByClass(panda, "count-true").textContent).toBe(pandaDisplay);
    expect(findByClass(panda, "signal-pill").textContent).toBe(pandaTrue >= PANDA_COUNT_THRESHOLD ? "✓ BET" : "· NO BET");
    expect(findByClass(panda, "threshold-caption").textContent).toBe(`${pandaTrue >= PANDA_COUNT_THRESHOLD ? "true" : "needs true"} ≥ +11 · ${pandaCaption}`);
  }
});

test("resets the round trace while retaining count chains, only showing burn rows before round one", () => {
  const bus = createBus();
  const host = new FakeElement("div");
  const root = mountCountPanel(host as unknown as HTMLElement, bus).element as unknown as FakeElement;
  const openingBefore = signals(0, 0, 0, 0);
  const openingAfter = signals(0, 0, 1, 0.13);
  const opening = counts([card("A", 0, 1, 0, 1)], openingBefore, openingAfter);
  bus.emit({ type: "shoe:opened", exposedBurnCard: { id: 1, rank: "A", value: 1 }, unseenBurnCount: 1, cardsRemaining: 414, openingCounts: opening });
  expect(allByClass(root, "trace-seat").some((item) => item.textContent === "BURN")).toBe(true);

  bus.emit({ type: "round:start", round: 1 });
  expect(allByClass(root, "trace-seat").some((item) => item.textContent === "BURN")).toBe(false);
  bus.emit({ type: "card:seen", card: { id: 2, rank: "4", value: 4 }, seat: "player", index: 0 });
  const roundOneAfter = signals(-1, -0.14, -1, -0.14);
  bus.emit({ type: "round:settled", result: settled(counts([card("4", -1, -2, -1, -1)], openingAfter, roundOneAfter)), cardsRemaining: 413 });
  expect(findByClass(block(root, "dragon"), "count-running").textContent).toBe("−1");

  bus.emit({ type: "round:start", round: 2 });
  bus.emit({ type: "card:seen", card: { id: 3, rank: "9", value: 9 }, seat: "banker", index: 0 });
  const roundTwoAfter = signals(1, 0.14, 3, 0.41);
  bus.emit({ type: "round:settled", result: settled(counts([card("9", 2, 4, 1, 3)], roundOneAfter, roundTwoAfter)), cardsRemaining: 412 });
  expect(findByClass(block(root, "dragon"), "count-running").textContent).toBe("+1");
  expect(allByClass(root, "trace-seat").some((item) => item.textContent === "BURN")).toBe(false);

  bus.emit({ type: "shoe:opened", exposedBurnCard: { id: 4, rank: "A", value: 1 }, unseenBurnCount: 1, cardsRemaining: 414, openingCounts: opening });
  expect(findByClass(block(root, "dragon"), "count-running").textContent).toBe("0");
  expect(allByClass(root, "trace-seat").some((item) => item.textContent === "BURN")).toBe(true);
});

test("continues reconciling hidden casino-mode events and reveals current state", () => {
  const bus = createBus();
  const host = new FakeElement("div");
  const root = mountCountPanel(host as unknown as HTMLElement, bus).element as unknown as FakeElement;
  bus.emit({ type: "mode:changed", mode: "casino" });
  expect(root.getAttribute("inert")).toBe("");
  expect(root.getAttribute("aria-hidden")).toBe("true");

  const before = signals(0, 0, 0, 0);
  const after = signals(22, 4.04, 55, 11.04);
  bus.emit({ type: "round:settled", result: settled(counts([card("9", 2, 4, 22, 55)], before, after)), cardsRemaining: 300 });
  expect(findByClass(block(root, "dragon"), "count-true").textContent).toBe("4.0");
  expect(findByClass(block(root, "panda"), "signal-pill").textContent).toBe("✓ BET");

  bus.emit({ type: "mode:changed", mode: "trainer" });
  expect(root.getAttribute("inert")).toBeNull();
  expect(root.getAttribute("aria-hidden")).toBe("false");
  expect(findByClass(block(root, "panda"), "count-true").textContent).toBe("11.0");
});
