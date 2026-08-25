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
  // The rank is spoken by the status region as each card is seen; the face
  // itself is decoration, and backface-visibility hides a face-down card
  // visually without hiding it from the accessibility tree.
  face.setAttribute("aria-hidden", "true");

  /** A corner index: rank stacked over its suit, as on a real card. */
  const makeIndex = (className: string) => {
    const index = document.createElement("span");
    index.className = `card-index ${className}`;

    const rankGlyph = document.createElement("span");
    rankGlyph.className = "card-index-rank";
    rankGlyph.textContent = rank;

    const suitGlyph = document.createElement("span");
    suitGlyph.className = "card-index-suit";
    suitGlyph.textContent = suit;

    index.append(rankGlyph, suitGlyph);
    return index;
  };

  const rankTop = makeIndex("card-rank-top");

  const suitCenter = document.createElement("span");
  suitCenter.className = "card-suit";
  suitCenter.textContent = suit;

  const rankBottom = makeIndex("card-rank-bottom");

  face.append(rankTop, suitCenter, rankBottom);

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
