import { formatCurrency, type BetKind } from "./types";

export type SpotSettleState = "idle" | "win" | "loss" | "push";

export interface BetSpotHandle {
  element: HTMLButtonElement;
  add(amount: number): void;
  removeLast(): number | undefined;
  clear(): void;
  settle(state: SpotSettleState): void;
  total(): number;
  snapshots(): number[];
  setLocked(lock: boolean): void;
  setLabel(): void;
  focus(): void;
}

export interface BetSpotMeta {
  kind: BetKind;
  name: string;
  odds: string;
  tone: string;
  footnote?: string;
}

function chipClassForAmount(amount: number): string {
  return `chip-value-${amount}`;
}

export function mountBetSpot(host: HTMLElement, meta: BetSpotMeta): BetSpotHandle {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `spot spot-${meta.kind}`;
  button.dataset.bet = meta.kind;
  button.style.setProperty("--spot-tone", meta.tone);

  const name = document.createElement("span");
  name.className = "spot-name";
  name.textContent = meta.name.toUpperCase();

  const odds = document.createElement("span");
  odds.className = "spot-odds";
  odds.textContent = meta.odds;

  const well = document.createElement("div");
  well.className = "spot-well";

  const wager = document.createElement("span");
  wager.className = "spot-wager";
  wager.textContent = "$0";

  const stateBadge = document.createElement("span");
  stateBadge.className = "spot-state";

  button.append(name, odds, well, wager, stateBadge);

  if (meta.footnote) {
    const foot = document.createElement("span");
    foot.className = "spot-footnote";
    foot.textContent = meta.footnote;
    button.append(foot);
  }

  host.append(button);

  const chips: { amount: number; element: HTMLSpanElement }[] = [];
  let settleState: SpotSettleState = "idle";

  const render = () => {
    const totalValue = chips.reduce((acc, chip) => acc + chip.amount, 0);
    wager.textContent = formatCurrency(totalValue);
    wager.dataset.total = `${totalValue}`;

    well.replaceChildren();

    chips.slice(0, 5).forEach((chip, index) => {
      chip.element.style.setProperty("--stack-index", `${index}`);
      well.append(chip.element);
    });

    if (chips.length > 5) {
      const badge = document.createElement("span");
      badge.className = "spot-badge";
      badge.textContent = `×${chips.length - 5}`;
      well.append(badge);
    }

    const stateText = settleState === "idle" ? "" : `, ${settleState}`;
    button.setAttribute(
      "aria-label",
      `${meta.name}, pays ${meta.odds}, ${formatCurrency(totalValue)} wagered${stateText}`,
    );
  };

  return {
    element: button,
    add(amount) {
      const chip = document.createElement("span");
      chip.className = `chip chip-stack ${chipClassForAmount(amount)}`;
      chip.textContent = `${amount}`;
      chips.push({ amount, element: chip });
      render();
    },
    removeLast() {
      const removed = chips.pop();
      if (!removed) {
        return undefined;
      }
      render();
      return removed.amount;
    },
    clear() {
      chips.splice(0, chips.length);
      settleState = "idle";
      button.classList.remove("settled-win", "settled-loss", "settled-push");
      button.dataset.state = "idle";
      stateBadge.textContent = "";
      render();
    },
    settle(state) {
      settleState = state;
      button.classList.remove("settled-win", "settled-loss", "settled-push");
      button.dataset.state = state;
      stateBadge.textContent = "";

      if (state === "win") {
        button.classList.add("settled-win");
        stateBadge.textContent = "✓ WIN";
      } else if (state === "loss") {
        button.classList.add("settled-loss");
        stateBadge.textContent = "LOSS";
      } else if (state === "push") {
        button.classList.add("settled-push");
        stateBadge.textContent = "PUSH";
      }

      render();
    },
    total() {
      return chips.reduce((acc, chip) => acc + chip.amount, 0);
    },
    snapshots() {
      return chips.map((chip) => chip.amount);
    },
    setLocked(lock) {
      button.disabled = lock;
      button.classList.toggle("locked", lock);
    },
    setLabel() {
      render();
    },
    focus() {
      button.focus();
    },
  };
}
