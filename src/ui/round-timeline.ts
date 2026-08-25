import type { Card } from "../engine/card";
import type { HandZoneHandle } from "./hand-zone";

type Seat = "player" | "banker";

export const FAST_SPEED_SCALE = 0.025;

export interface TimelineTimers {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(timeout: number): void;
}

export interface TimelineStep {
  seat: Seat;
  card: Card;
  index: number;
  isThird: boolean;
  ruleText?: string;
  playerTotal: number;
  bankerTotal: number;
}

export interface RoundTimelineHandle {
  play(steps: TimelineStep[]): Promise<void>;
  fastForward(): void;
  isBusy(): boolean;
  destroy(): void;
}

export interface RoundTimelineContext {
  tableElement: HTMLElement;
  originRect(): DOMRect;
  hands: {
    player: HandZoneHandle;
    banker: HandZoneHandle;
  };
  onCardSeen(seat: Seat, card: Card, index: number, isThird: boolean): void;
  onTotals(playerTotal: number, bankerTotal: number): void;
  onThird(seat: Seat, text: string): void;
}

interface TimelineDurations {
  deal: number;
  flip: number;
  third: number;
}

function parseDuration(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) {
    return Number.parseFloat(trimmed);
  }
  if (trimmed.endsWith("s")) {
    return Number.parseFloat(trimmed) * 1000;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function scaleDuration(value: number, speedScale: number): number {
  return Math.max(1, Math.round(value * speedScale));
}

export function timelineWaitSchedule(steps: TimelineStep[], durations: TimelineDurations): number[] {
  return steps.flatMap((step, index) => [
    ...(index > 0 ? [140] : []),
    durations.deal * 0.7,
    durations.flip,
    step.isThird ? durations.third : durations.deal * 0.3,
  ]);
}

export async function playTimelineWaitSchedule(
  schedule: number[],
  wait: (duration: number) => Promise<void>,
): Promise<void> {
  for (const duration of schedule) {
    await wait(duration);
  }
}

export function createTimelineWaiter(timers: TimelineTimers) {
  let speedScale = 1;
  let fastForwarded = false;
  let activeTimeout: number | undefined;
  let activeResolve: (() => void) | undefined;

  const clearPendingWait = () => {
    if (activeTimeout !== undefined) {
      timers.clearTimeout(activeTimeout);
      activeTimeout = undefined;
    }
    if (activeResolve) {
      const resolve = activeResolve;
      activeResolve = undefined;
      resolve();
    }
  };

  return {
    wait(duration: number) {
      if (fastForwarded) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        activeResolve = resolve;
        activeTimeout = timers.setTimeout(() => {
          activeTimeout = undefined;
          activeResolve = undefined;
          resolve();
        }, scaleDuration(duration, speedScale));
      });
    },
    fastForward() {
      fastForwarded = true;
      speedScale = FAST_SPEED_SCALE;
      clearPendingWait();
    },
    reset() {
      fastForwarded = false;
      speedScale = 1;
    },
    clearPendingWait,
  };
}

function nextFrame(): { promise: Promise<void>; resolve: () => void } {
  let settled = false;
  let frame = 0;
  let fallback = 0;
  let finish!: () => void;

  const promise = new Promise<void>((resolve) => {
    finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      resolve();
    };
    frame = window.requestAnimationFrame(finish);
    // A backgrounded tab may defer animation frames indefinitely. The card
    // still has its initial DOM state, so this is safe to continue without one.
    fallback = window.setTimeout(finish, 50);
  });

  return { promise, resolve: finish };
}

export function mountRoundTimeline(context: RoundTimelineContext): RoundTimelineHandle {
  let busy = false;
  let resolvePendingFrame: (() => void) | undefined;

  const dealDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-deal"));
  const flipDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-flip"));
  const thirdDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-third"));
  const waiter = createTimelineWaiter({
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (timeout) => window.clearTimeout(timeout),
  });
  const wait = waiter.wait;

  const animateCard = async (step: TimelineStep, handle: ReturnType<HandZoneHandle["addCard"]>) => {
    const card = handle.element;
    const frame = nextFrame();
    resolvePendingFrame = frame.resolve;
    await frame.promise;
    resolvePendingFrame = undefined;

    const origin = context.originRect();
    const target = card.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);

    card.style.setProperty("--deal-x", `${dx}px`);
    card.style.setProperty("--deal-y", `${dy}px`);
    card.classList.add("is-dealing");

    await wait(dealDuration * 0.7);
    handle.flip();
    await wait(flipDuration);
    context.onCardSeen(step.seat, step.card, step.index, step.isThird);

    if (step.isThird) {
      card.classList.add("is-third-emphasis");
      if (step.ruleText) {
        context.onThird(step.seat, step.ruleText);
      }
    }

    await wait(step.isThird ? thirdDuration : dealDuration * 0.3);
    card.classList.remove("is-dealing");
    card.style.removeProperty("--deal-x");
    card.style.removeProperty("--deal-y");
    card.classList.remove("is-third-emphasis");
  };

  return {
    isBusy() {
      return busy;
    },
    fastForward() {
      waiter.fastForward();
      resolvePendingFrame?.();
      context.tableElement.classList.add("speed-fast");
    },
    async play(steps) {
      if (busy) {
        return;
      }

      busy = true;
      waiter.reset();
      context.tableElement.classList.remove("speed-fast");
      context.hands.player.clear();
      context.hands.banker.clear();

      try {
        for (let index = 0; index < steps.length; index += 1) {
          if (index > 0) {
            await wait(140);
          }

          const step = steps[index];
          const hand = step.seat === "player" ? context.hands.player : context.hands.banker;
          const handle = hand.addCard(step.card);
          if (step.isThird) {
            handle.setRotated();
          }

          await animateCard(step, handle);
          context.onTotals(step.playerTotal, step.bankerTotal);
        }
      } finally {
        busy = false;
        resolvePendingFrame = undefined;
        waiter.reset();
      }
    },
    destroy() {
      busy = false;
      resolvePendingFrame?.();
      resolvePendingFrame = undefined;
      waiter.clearPendingWait();
      context.tableElement.classList.remove("speed-fast");
    },
  };
}
