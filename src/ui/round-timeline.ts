import type { Card } from "../engine/card";
import type { HandZoneHandle } from "./hand-zone";

type Seat = "player" | "banker";

export interface TimelineStep {
  seat: Seat;
  card: Card;
  index: number;
  isThird: boolean;
  ruleText?: string;
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

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

export function mountRoundTimeline(context: RoundTimelineContext): RoundTimelineHandle {
  let busy = false;
  let speedScale = 1;
  let activeTimeout: number | undefined;
  let activeResolve: (() => void) | undefined;

  const dealDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-deal"));
  const flipDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-flip"));
  const thirdDuration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--dur-third"));

  const scaled = (value: number) => Math.max(1, Math.round(value * speedScale));

  const wait = (ms: number) => new Promise<void>((resolve) => {
    activeResolve = resolve;
    activeTimeout = window.setTimeout(() => {
      activeTimeout = undefined;
      activeResolve = undefined;
      resolve();
    }, scaled(ms));
  });

  const clearPendingWait = () => {
    if (activeTimeout !== undefined) {
      window.clearTimeout(activeTimeout);
      activeTimeout = undefined;
    }
    if (activeResolve) {
      const resolve = activeResolve;
      activeResolve = undefined;
      resolve();
    }
  };

  const handTotal = (cards: Card[]) => cards.reduce((sum, card) => sum + card.value, 0) % 10;

  const updateTotals = (steps: TimelineStep[], count: number) => {
    const played = steps.slice(0, count);
    const playerCards = played.filter((step) => step.seat === "player").map((step) => step.card);
    const bankerCards = played.filter((step) => step.seat === "banker").map((step) => step.card);
    context.onTotals(handTotal(playerCards), handTotal(bankerCards));
  };

  const animateCard = async (step: TimelineStep, handle: ReturnType<HandZoneHandle["addCard"]>) => {
    const card = handle.element;
    await nextFrame();

    const origin = context.originRect();
    const target = card.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);

    card.style.transition = "none";
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(-8deg) scale(.86)`;
    card.style.opacity = "0.98";
    card.style.boxShadow = "none";

    void card.offsetWidth;

    card.style.transition = `transform ${scaled(dealDuration)}ms var(--ease-deal), box-shadow ${scaled(dealDuration)}ms var(--ease-deal), opacity ${scaled(dealDuration)}ms var(--ease-deal)`;
    card.style.transform = "translate(0, 0) rotate(0deg) scale(1)";
    card.style.opacity = "1";
    card.style.boxShadow = "var(--shadow-card)";

    await wait(dealDuration * 0.7);
    await handle.flip(scaled(flipDuration));
    context.onCardSeen(step.seat, step.card, step.index, step.isThird);

    if (step.isThird) {
      card.classList.add("is-third-emphasis");
      if (step.ruleText) {
        context.onThird(step.seat, step.ruleText);
      }
    }

    await wait(step.isThird ? thirdDuration * 0.4 : dealDuration * 0.3);
    card.style.transition = "";
    card.style.transform = "";
    card.style.opacity = "";
    card.classList.remove("is-third-emphasis");
  };

  return {
    isBusy() {
      return busy;
    },
    fastForward() {
      speedScale = 0.25;
      context.tableElement.classList.add("speed-fast");
      clearPendingWait();
    },
    async play(steps) {
      if (busy) {
        return;
      }

      busy = true;
      speedScale = 1;
      context.tableElement.classList.remove("speed-fast");
      context.hands.player.clear();
      context.hands.banker.clear();

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
        updateTotals(steps, index + 1);
      }

      busy = false;
      speedScale = 1;
      context.tableElement.classList.remove("speed-fast");
    },
    destroy() {
      busy = false;
      clearPendingWait();
      context.tableElement.classList.remove("speed-fast");
    },
  };
}
