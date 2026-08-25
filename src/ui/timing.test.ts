import { expect, test } from "bun:test";
import {
  FAST_SPEED_SCALE,
  createTimelineWaiter,
  playTimelineWaitSchedule,
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

test("a normal six-card timeline contains only the specified deal, flip, third-card, and stagger waits", () => {
  const steps: TimelineStep[] = Array.from({ length: 6 }, (_, index) => ({
    seat: index % 2 === 0 ? "player" : "banker",
    card: { id: index, rank: "A", value: 1 },
    index: Math.floor(index / 2),
    isThird: index >= 4,
    playerTotal: 0,
    bankerTotal: 0,
  }));

  const schedule = timelineWaitSchedule(steps, { deal: 380, flip: 300, third: 520 });
  expect(schedule.reduce((total, duration) => total + duration, 0)).toBe(5592);
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
  expect(now).toBe(266);
});

test("storage read fallback survives a throwing storage getter", () => {
  expect(readStoredItem("ezbac.bankroll", () => {
    throw new DOMException("Blocked", "SecurityError");
  })).toBeNull();
  expect(readStoredItem("ezbac.chip", () => ({ getItem: () => "25" }))).toBe("25");
});
