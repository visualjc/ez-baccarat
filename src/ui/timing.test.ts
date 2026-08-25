import { expect, test } from "bun:test";
import type { HandZoneHandle } from "./hand-zone";
import {
  FAST_SPEED_SCALE,
  createTimelineWaiter,
  mountRoundTimeline,
  playTimelineWaitSchedule,
  roundUnlockWaitSchedule,
  scaleDuration,
  timelineWaitSchedule,
  type TimelineTimers,
  type TimelineStep,
} from "./round-timeline";
import { readStoredItem } from "./storage";

test("FAST time scale turns live waits into effectively immediate waits", () => {
  expect(scaleDuration(520, FAST_SPEED_SCALE)).toBe(13);
  expect(scaleDuration(380, 1)).toBe(380);
  expect(scaleDuration(0, FAST_SPEED_SCALE)).toBe(1);
});

test("a normal six-card DEAL-to-unlocked schedule stays within the CSS-token budget", async () => {
  const steps: TimelineStep[] = Array.from({ length: 6 }, (_, index) => ({
    seat: index % 2 === 0 ? "player" : "banker",
    card: { id: index, rank: "A", value: 1 },
    index: Math.floor(index / 2),
    isThird: index >= 4,
    playerTotal: 0,
    bankerTotal: 0,
  }));

  const css = await Bun.file(new URL("../styles/anim.css", import.meta.url)).text();
  const duration = (name: string) => {
    const match = css.match(new RegExp(`${name}:\\s*(\\d+)ms`));
    if (!match) throw new Error(`missing ${name}`);
    return Number(match[1]);
  };
  const durations = {
    deal: duration("--dur-deal"),
    flip: duration("--dur-flip"),
    third: duration("--dur-third"),
    bannerIn: duration("--dur-banner-in"),
    sweep: duration("--dur-sweep"),
    pay: duration("--dur-pay"),
  };
  const schedule = roundUnlockWaitSchedule(steps, durations);
  const specSum = (4 - 1) * 140 + durations.deal * 0.7 + durations.flip + 2 * durations.third;
  const bannerAndSettleAllowance = durations.bannerIn + Math.max(durations.sweep, durations.pay);
  const budget = specSum + bannerAndSettleAllowance;
  expect(schedule.reduce((total, duration) => total + duration, 0)).toBe(budget);
  expect(schedule.slice(1, -2)).toEqual([durations.third, durations.third]);
  expect(schedule.slice(1, -2).every((duration) => duration > 0)).toBe(true);
  expect(budget).toBeLessThanOrEqual(6000);

  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { callback: () => void; due: number }>();
  const waiter = createTimelineWaiter({
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  const playback = playTimelineWaitSchedule(schedule, waiter.wait);
  for (let turn = 0; turn < schedule.length + 5; turn += 1) {
    await Promise.resolve();
    const next = [...timers.entries()].sort(([, a], [, b]) => a.due - b.due)[0];
    if (!next) {
      continue;
    }
    timers.delete(next[0]);
    now = next[1].due;
    next[1].callback();
  }
  await playback;
  expect(now).toBeLessThanOrEqual(budget);
});

test("an overlapped timeline waits through the third-card emphasis before revealing it", async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const oldGetComputedStyle = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
  const frames = new Map<number, FrameRequestCallback>();
  const timers = new Map<number, { callback: () => void; delay: number }>();
  let nextId = 1;
  const events: string[] = [];

  const element = () => ({
    classList: { add() {}, remove() {} },
    style: { setProperty() {}, removeProperty() {} },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  });
  const addCard = () => ({
    element: element(),
    flip: () => events.push("flip"),
    setRotated() {},
  });

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      requestAnimationFrame(callback: FrameRequestCallback) {
        const id = nextId++;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame(id: number) { frames.delete(id); },
      setTimeout(callback: () => void, delay: number) {
        const id = nextId++;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimeout(id: number) { timers.delete(id); },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { documentElement: {} },
  });
  Object.defineProperty(globalThis, "getComputedStyle", {
    configurable: true,
    value: () => ({
      getPropertyValue: (name: string) => ({
        "--dur-deal": "380ms",
        "--dur-flip": "300ms",
        "--dur-third": "520ms",
      })[name] ?? "0ms",
    }),
  });

  try {
    const timeline = mountRoundTimeline({
      tableElement: element() as unknown as HTMLElement,
      originRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect,
      hands: {
        player: { addCard, clear() {} } as unknown as HandZoneHandle,
        banker: { addCard, clear() {} } as unknown as HandZoneHandle,
      },
      onCardSeen: () => events.push("seen"),
      onTotals: () => events.push("totals"),
      onThird: () => events.push("third"),
    });
    const playback = timeline.play([{
      seat: "player",
      card: { id: 1, rank: "A", value: 1 },
      index: 2,
      isThird: true,
      ruleText: "Player draws.",
      playerTotal: 3,
      bankerTotal: 4,
    }]);

    await Promise.resolve();
    const [frameId, frame] = [...frames.entries()][0] ?? [];
    if (frameId === undefined || !frame) throw new Error("expected third-card frame");
    frames.delete(frameId);
    frame(0);
    await Promise.resolve();
    await Promise.resolve();

    expect(events).toEqual(["flip"]);
    const [timerId, timer] = [...timers.entries()][0] ?? [];
    if (timerId === undefined || !timer) throw new Error("expected third-card emphasis wait");
    expect(timer.delay).toBe(520);
    timers.delete(timerId);
    timer.callback();
    await playback;
    expect(events).toEqual(["flip", "seen", "third", "totals"]);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete (globalThis as { window?: unknown }).window;
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete (globalThis as { document?: unknown }).document;
    if (oldGetComputedStyle) Object.defineProperty(globalThis, "getComputedStyle", oldGetComputedStyle);
    else delete (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
  }
});

test("a FAST timeline resolves a full schedule when activated mid-schedule", async () => {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { callback: () => void; due: number }>();
  const clock: TimelineTimers = {
    setTimeout(callback, delay) {
      const id = nextId;
      nextId += 1;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const waiter = createTimelineWaiter(clock);
  const steps: TimelineStep[] = Array.from({ length: 6 }, (_, index) => ({
    seat: index % 2 === 0 ? "player" : "banker",
    card: { id: index, rank: "A", value: 1 },
    index: Math.floor(index / 2),
    isThird: index >= 4,
    playerTotal: 0,
    bankerTotal: 0,
  }));
  const schedule = timelineWaitSchedule(steps, { deal: 380, flip: 300, third: 520 });

  let finished = false;
  const playback = playTimelineWaitSchedule(schedule, waiter.wait).then(() => {
    finished = true;
  });
  await Promise.resolve();

  const first = [...timers.entries()][0];
  expect(first).toBeDefined();
  if (!first) {
    throw new Error("expected the first timeline wait");
  }
  timers.delete(first[0]);
  now = first[1].due;
  first[1].callback();
  await Promise.resolve();
  waiter.fastForward();

  for (let turns = 0; !finished && turns < 100; turns += 1) {
    await Promise.resolve();
    const next = [...timers.entries()].sort(([, a], [, b]) => a.due - b.due)[0];
    if (!next) {
      continue;
    }
    const [id, timer] = next;
    timers.delete(id);
    now = timer.due;
    timer.callback();
  }

  await playback;
  expect(finished).toBe(true);
  expect(now).toBe(986);
});

test("FAST DEAL-to-unlocked playback finishes within 800ms of activation", async () => {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { callback: () => void; due: number }>();
  const waiter = createTimelineWaiter({
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  const steps: TimelineStep[] = Array.from({ length: 6 }, (_, index) => ({
    seat: index % 2 === 0 ? "player" : "banker",
    card: { id: index, rank: "A", value: 1 },
    index: Math.floor(index / 2),
    isThird: index >= 4,
    playerTotal: 0,
    bankerTotal: 0,
  }));
  const schedule = roundUnlockWaitSchedule(steps, {
    deal: 380, flip: 300, third: 520, bannerIn: 320, sweep: 520, pay: 420,
  });

  waiter.fastForward();
  await playTimelineWaitSchedule(schedule, waiter.wait);
  expect(now).toBeLessThanOrEqual(800);
  expect(timers.size).toBe(0);
});

test("storage read fallback survives a throwing storage getter", () => {
  expect(readStoredItem("ezbac.bankroll", () => {
    throw new DOMException("Blocked", "SecurityError");
  })).toBeNull();
  expect(readStoredItem("ezbac.chip", () => ({ getItem: () => "25" }))).toBe("25");
});
