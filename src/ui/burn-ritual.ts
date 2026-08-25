import type { Card } from "../engine/card";
import { createCard } from "./card-el";

export interface BurnRitualHandle {
  run(exposedCard: Card, burnCount: number): Promise<void>;
  clear(): void;
}

function parseDuration(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value.endsWith("ms")) {
    return Number.parseFloat(value);
  }
  if (value.endsWith("s")) {
    return Number.parseFloat(value) * 1000;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function mountBurnRitual(
  host: HTMLElement,
  readout: HTMLElement,
  announce: (text: string) => void,
): BurnRitualHandle {
  return {
    clear() {
      host.replaceChildren();
      readout.textContent = "";
    },
    async run(exposedCard, burnCount) {
      this.clear();

      const exposeMs = parseDuration("--dur-burn-expose");
      const holdMs = parseDuration("--dur-burn-hold");
      const fanMs = parseDuration("--dur-burn-fan");

      const stage = document.createElement("div");
      stage.className = "burn-stage";

      const cardHandle = createCard(exposedCard);
      cardHandle.element.classList.add("burn-card");
      stage.append(cardHandle.element);
      host.append(stage);

      cardHandle.element.classList.add("from-shoe");
      await wait(exposeMs * 0.55);
      await cardHandle.flip();
      cardHandle.element.classList.add("focused");

      const text = `BURN CARD · ${exposedCard.rank} · burning ${burnCount} cards`;
      const callout = document.createElement("p");
      callout.className = "burn-callout";
      callout.textContent = text;
      host.append(callout);
      readout.textContent = text;
      announce(text);

      await wait(holdMs);

      const fanRoot = document.createElement("div");
      fanRoot.className = "burn-fan";
      host.append(fanRoot);

      for (let index = 0; index < burnCount; index += 1) {
        const back = document.createElement("span");
        back.className = "burn-fan-card";
        back.style.setProperty("--burn-index", `${index}`);
        back.style.setProperty("--burn-rot", `${index % 2 === 0 ? 5 : -5}deg`);
        fanRoot.append(back);
        await wait(40);
      }

      await wait(fanMs);
      this.clear();
    },
  };
}
