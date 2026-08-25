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

export interface TimelineDurations {
  deal: number;
  flip: number;
  third: number;
}

export interface RoundUnlockDurations extends TimelineDurations {
  bannerIn: number;
  sweep: number;
  pay: number;
}

const DEAL_STAGGER = 140;

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
  const initialCards = steps.filter((step) => !step.isThird);
  const thirdCards = steps.filter((step) => step.isThird);
  const initialDuration = initialCards.length === 0
    ? 0
    : (initialCards.length - 1) * DEAL_STAGGER + durations.deal * 0.7 + durations.flip;

  return [
    ...(initialDuration > 0 ? [initialDuration] : []),
    ...thirdCards.map(() => durations.third),
  ];
}

/**
 * The blocking path from DEAL to unlocked controls. Banner and settlement
 * animations overlap with their visual peers, so only the longer settlement
 * duration belongs on that path.
 */
export function roundUnlockWaitSchedule(
  steps: TimelineStep[],
  durations: RoundUnlockDurations,
): number[] {
  return [
    ...timelineWaitSchedule(steps, durations),
    durations.bannerIn,
    Math.max(durations.sweep, durations.pay),
  ];
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
  const pending = new Map<number, () => void>();

  const clearPendingWait = () => {
    for (const [timeout, resolve] of pending) {
      timers.clearTimeout(timeout);
      resolve();
    }
    pending.clear();
  };

  return {
    wait(duration: number) {
      if (fastForwarded) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const timeout = timers.setTimeout(() => {
          pending.delete(timeout);
          resolve();
        }, scaleDuration(duration, speedScale));
        pending.set(timeout, resolve);
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
  let fastForwarding = false;
  const pendingFrames = new Set<() => void>();

  const dealDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-deal"));
  const flipDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-flip"));
  const thirdDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-third"));
  const waiter = createTimelineWaiter({
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (timeout) => window.clearTimeout(timeout),
  });
  const wait = waiter.wait;

  const prepareCard = async (handle: ReturnType<HandZoneHandle["addCard"]>) => {
    const card = handle.element;
    if (!fastForwarding) {
      const frame = nextFrame();
      pendingFrames.add(frame.resolve);
      await frame.promise;
      pendingFrames.delete(frame.resolve);
    }

    const origin = context.originRect();
    const target = card.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);

    card.style.setProperty("--deal-x", `${dx}px`);
    card.style.setProperty("--deal-y", `${dy}px`);
    card.classList.add("is-dealing");
    return card;
  };

  const animateInitialCard = async (step: TimelineStep, handle: ReturnType<HandZoneHandle["addCard"]>) => {
    const card = await prepareCard(handle);
    await wait(dealDuration * 0.7);
    handle.flip();
    await wait(flipDuration);
    context.onCardSeen(step.seat, step.card, step.index, step.isThird);
    context.onTotals(step.playerTotal, step.bankerTotal);
    card.classList.remove("is-dealing");
    card.style.removeProperty("--deal-x");
    card.style.removeProperty("--deal-y");
  };

  const animateThirdCard = async (step: TimelineStep, handle: ReturnType<HandZoneHandle["addCard"]>) => {
    const card = await prepareCard(handle);
    handle.flip();
    card.classList.add("is-third-emphasis");
    await wait(thirdDuration);
    context.onCardSeen(step.seat, step.card, step.index, true);
    if (step.ruleText) {
      context.onThird(step.seat, step.ruleText);
    }
    card.classList.remove("is-dealing", "is-third-emphasis");
    card.style.removeProperty("--deal-x");
    card.style.removeProperty("--deal-y");
  };

  return {
    isBusy() {
      return busy;
    },
    fastForward() {
      fastForwarding = true;
      waiter.fastForward();
      for (const resolve of pendingFrames) {
        resolve();
      }
      context.tableElement.classList.add("speed-fast");
    },
    async play(steps) {
      if (busy) {
        return;
      }

      busy = true;
      fastForwarding = false;
      waiter.reset();
      context.tableElement.classList.remove("speed-fast");
      context.hands.player.clear();
      context.hands.banker.clear();

      try {
        const initialCards = steps.filter((step) => !step.isThird);
        const thirdCards = steps.filter((step) => step.isThird);
        const initialAnimations: Promise<void>[] = [];

        for (let index = 0; index < initialCards.length; index += 1) {
          if (index > 0) {
            await wait(DEAL_STAGGER);
          }

          const step = initialCards[index]!;
          const hand = step.seat === "player" ? context.hands.player : context.hands.banker;
          const handle = hand.addCard(step.card);
          initialAnimations.push(animateInitialCard(step, handle));
        }
        await Promise.all(initialAnimations);

        for (const step of thirdCards) {
          const hand = step.seat === "player" ? context.hands.player : context.hands.banker;
          const handle = hand.addCard(step.card);
          handle.setRotated();
          await animateThirdCard(step, handle);
          context.onTotals(step.playerTotal, step.bankerTotal);
        }
      } finally {
        busy = false;
        fastForwarding = false;
        pendingFrames.clear();
        waiter.reset();
      }
    },
    destroy() {
      busy = false;
      fastForwarding = false;
      for (const resolve of pendingFrames) {
        resolve();
      }
      pendingFrames.clear();
      waiter.clearPendingWait();
      context.tableElement.classList.remove("speed-fast");
    },
  };
}
