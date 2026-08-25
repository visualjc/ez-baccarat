import { describe, expect, test } from "bun:test";

import { valueFromRank, type Card, type Rank } from "../engine/card";
import { createEngine, dealRound } from "../engine/engine";
import { mountBankroll } from "./bankroll";
import { mountKeyboard, type KeyboardHandlers } from "./keyboard";
import {
  createTimelineWaiter,
  playTimelineWaitSchedule,
  timelineWaitSchedule,
  type TimelineStep,
  type TimelineTimers,
} from "./round-timeline";
import {
  applyBankrollDelta,
  canPlaceChip,
  cloneBetHistory,
  placeChip,
  settlementNet,
} from "./state";

function cards(ranks: Rank[]): Card[] {
  return ranks.map((rank, id) => ({ id, rank, value: valueFromRank(rank) }));
}

describe("QA bankroll probe", () => {
  test("applies engine settlements across five rounds covering every wager and Dragon push", () => {
    const engine = createEngine({
      // A + K open the shoe. The following rounds are Player, Banker, Tie,
      // Dragon 7, and Panda 8; all outcomes come from dealRound/settleHand.
      initialCards: cards([
        "A", "K",
        "4", "3", "5", "4",
        "3", "4", "4", "5",
        "3", "4", "5", "4",
        "2", "2", "4", "2", "3",
        "2", "3", "3", "4", "3",
      ]),
      decks: 1,
      cutOffset: 1,
      shuffle: false,
    });
    const wagers = cloneBetHistory({
      player: [10],
      banker: [10],
      tie: [10],
      dragon: [10],
      panda: [10],
    });
    const expected = [
      { outcome: "player", dragon: false, panda: false, net: -30, bankroll: 970 },
      { outcome: "banker", dragon: false, panda: false, net: -30, bankroll: 940 },
      { outcome: "tie", dragon: false, panda: false, net: 60, bankroll: 1000 },
      { outcome: "banker", dragon: true, panda: false, net: 370, bankroll: 1370 },
      { outcome: "player", dragon: false, panda: true, net: 230, bankroll: 1600 },
    ] as const;

    let bankroll = 1000;
    for (const expectedRound of expected) {
      const result = dealRound(engine);
      const net = settlementNet(wagers, result.settlement);
      bankroll = applyBankrollDelta(bankroll, net);

      expect({
        outcome: result.settlement.outcome,
        dragon: result.settlement.isDragon,
        panda: result.settlement.isPanda,
        net,
        bankroll,
      }).toEqual(expectedRound);
    }
  });

  test("throwing localStorage falls back at mount and cannot break a bet settlement", () => {
    class FakeElement {
      className = "";
      textContent = "";
      offsetWidth = 0;
      children: FakeElement[] = [];
      classList = { add() {}, remove() {} };
      append(...children: FakeElement[]) {
        this.children.push(...children);
      }
    }

    const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    const oldRaf = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        get localStorage() {
          throw new DOMException("Blocked", "SecurityError");
        },
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: () => new FakeElement() },
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(performance.now() + 300);
        return 1;
      },
    });

    try {
      const host = new FakeElement();
      const bankroll = mountBankroll(host as unknown as HTMLElement);
      expect(bankroll.get()).toBe(1000);

      let history = cloneBetHistory();
      expect(canPlaceChip(bankroll.get(), history, 25)).toBe(true);
      history = placeChip(history, "banker", 25);
      const result = dealRound(createEngine({
        initialCards: cards(["A", "K", "3", "4", "4", "5"]),
        decks: 1,
        cutOffset: 1,
        shuffle: false,
      }));
      expect(bankroll.apply(settlementNet(history, result.settlement))).toBe(1025);
    } finally {
      if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
      else delete (globalThis as { window?: unknown }).window;
      if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
      else delete (globalThis as { document?: unknown }).document;
      if (oldRaf) Object.defineProperty(globalThis, "requestAnimationFrame", oldRaf);
      else delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    }
  });
});

describe("QA keyboard probe", () => {
  test("routes every documented key and ignores unknown keys", () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        addEventListener(_type: string, callback: (event: KeyboardEvent) => void) {
          listener = callback;
        },
        removeEventListener() {},
      },
    });

    const calls: string[] = [];
    const handlers: KeyboardHandlers = {
      bet: (kind) => calls.push(`bet:${kind}`),
      selectChip: (value) => calls.push(`chip:${value}`),
      deal: () => calls.push("deal"),
      fastForward: () => calls.push("fastForward"),
      clear: () => calls.push("clear"),
      rebet: () => calls.push("rebet"),
      newShoe: () => calls.push("newShoe"),
      removeLast: () => calls.push("removeLast"),
      toggleMode: () => calls.push("toggleMode"),
      dismiss: () => calls.push("dismiss"),
      help: () => calls.push("help"),
    };

    try {
      const keyboard = mountKeyboard(handlers);
      const press = (key: string, shiftKey = false) => {
        let prevented = false;
        listener?.({
          key,
          shiftKey,
          target: null,
          isComposing: false,
          metaKey: false,
          ctrlKey: false,
          altKey: false,
          preventDefault: () => { prevented = true; },
        } as unknown as KeyboardEvent);
        return prevented;
      };
      const cases = [
        ["P", "bet:player"], ["B", "bet:banker"], ["T", "bet:tie"],
        ["7", "bet:dragon"], ["8", "bet:panda"],
        ["1", "chip:1"], ["2", "chip:5"], ["3", "chip:25"],
        ["4", "chip:100"], ["5", "chip:500"], ["6", "chip:1000"],
        ["Space", "deal"], ["Enter", "deal"], ["Backspace", "removeLast"],
        ["C", "clear"], ["R", "rebet"], ["S", "newShoe"],
        ["M", "toggleMode"], ["?", "help"], ["Escape", "dismiss"],
      ] as const;

      for (const [documentedKey, expectedCall] of cases) {
        calls.length = 0;
        const key = documentedKey === "Space" ? " " : documentedKey;
        press(key);
        expect(calls).toEqual([expectedCall]);
      }

      calls.length = 0;
      expect(press("Tab")).toBe(false);
      expect(press("Tab", true)).toBe(false);
      expect(press("Z")).toBe(false);
      expect(calls).toEqual([]);
      keyboard.detach();
    } finally {
      if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
      else delete (globalThis as { document?: unknown }).document;
    }
  });
});

describe("QA timeline probe", () => {
  const steps: TimelineStep[] = Array.from({ length: 6 }, (_, index) => ({
    seat: index % 2 === 0 ? "player" : "banker",
    card: { id: index, rank: "A", value: 1 },
    index: Math.floor(index / 2),
    isThird: index >= 4,
    playerTotal: 0,
    bankerTotal: 0,
  }));

  test("normal six-card schedule equals the explicit sum of authored waits", () => {
    const schedule = timelineWaitSchedule(steps, { deal: 380, flip: 300, third: 520 });
    const specSum = 4 * (380 + 300) + 2 * (380 * 0.7 + 300 + 520) + 5 * 140;
    expect(schedule.reduce((sum, duration) => sum + duration, 0)).toBe(specSum);
    expect(specSum).toBe(5592);
    expect(specSum).toBeGreaterThan(3400);
  });

  test("fastForward resolves the active wait and the remainder of a schedule", async () => {
    let nextId = 0;
    const timers = new Map<number, () => void>();
    const clock: TimelineTimers = {
      setTimeout(callback) {
        const id = nextId++;
        timers.set(id, callback);
        return id;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
    };
    const waiter = createTimelineWaiter(clock);
    const schedule = timelineWaitSchedule(steps, { deal: 380, flip: 300, third: 520 });
    let finished = false;
    const playback = playTimelineWaitSchedule(schedule, waiter.wait).then(() => { finished = true; });

    await Promise.resolve();
    expect(timers.size).toBe(1);
    waiter.fastForward();
    for (let turn = 0; !finished && turn < schedule.length + 5; turn += 1) {
      await Promise.resolve();
    }
    await playback;

    expect(finished).toBe(true);
    expect(timers.size).toBe(0);
  });
});
