import type { Card } from "../engine/card";

export interface CardHandle {
  element: HTMLDivElement;
  flip(): void;
  setRotated(): void;
}

const SUITS = ["♠", "♥", "♦", "♣"] as const;

export function createCard(card: Card): CardHandle {
  const rank = card.rank;
  const suit = SUITS[card.id % SUITS.length];

  const root = document.createElement("div");
  root.className = "card";
  root.dataset.rank = rank;
  root.dataset.suit = suit;

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const face = document.createElement("div");
  face.className = "card-face";

  const rankTop = document.createElement("span");
  rankTop.className = "card-rank-top";
  rankTop.textContent = `${rank}${suit}`;

  const suitCenter = document.createElement("span");
  suitCenter.className = "card-suit";
  suitCenter.textContent = suit;

  const center = document.createElement("span");
  center.className = "card-center";
  center.textContent = rank;

  const rankBottom = document.createElement("span");
  rankBottom.className = "card-rank-bottom";
  rankBottom.textContent = `${rank}${suit}`;

  face.append(rankTop, suitCenter, center, rankBottom);

  const back = document.createElement("div");
  back.className = "card-back";

  inner.append(face, back);
  root.append(inner);

  if (suit === "♥" || suit === "♦") {
    root.classList.add("is-red");
  }

  return {
    element: root,
    flip() {
      if (root.classList.contains("is-flipped")) {
        return;
      }
      root.classList.add("is-flipped");
    },
    setRotated() {
      root.classList.add("is-third");
    },
  };
}
