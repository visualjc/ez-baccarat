import type { Card } from "../engine/card";
import { createCard } from "./card-el";
import type { Seat } from "./types";

export interface HandZoneHandle {
  element: HTMLElement;
  addCard(card: Card): ReturnType<typeof createCard>;
  setTotal(total: number): void;
  clear(): void;
  emphasizeThird(message: string | null): void;
  seat: Seat;
  getCards(): Card[];
}

export function mountHandZone(host: HTMLElement, seat: Seat): HandZoneHandle {
  const root = document.createElement("div");
  root.className = "hand";
  root.dataset.seat = seat;

  const label = document.createElement("span");
  label.className = "hand-label";
  label.textContent = seat.toUpperCase();

  const cards = document.createElement("div");
  cards.className = "hand-cards";

  const total = document.createElement("span");
  total.className = "hand-total";
  total.textContent = "0";

  const rule = document.createElement("span");
  rule.className = "hand-rule";

  // DOM order matches the visual order, so a screen reader reads
  // "PLAYER, 6" before the cards rather than after them.
  root.append(label, total, cards, rule);
  host.append(root);

  const cardList: { card: Card; handle: ReturnType<typeof createCard> }[] = [];

  return {
    element: root,
    seat,
    addCard(card) {
      const handle = createCard(card);
      cards.append(handle.element);
      cardList.push({ card, handle });
      return handle;
    },
    setTotal(value) {
      total.classList.remove("anim-total-tick");
      void total.offsetWidth;
      total.classList.add("anim-total-tick");
      total.textContent = `${value}`;
    },
    clear() {
      cardList.splice(0, cardList.length);
      cards.replaceChildren();
      total.textContent = "0";
      rule.textContent = "";
      rule.classList.remove("show");
    },
    emphasizeThird(message) {
      rule.textContent = message ?? "";
      rule.classList.toggle("show", Boolean(message));
    },
    getCards() {
      return cardList.map((entry) => entry.card);
    },
  };
}
