import { cloneBetHistory } from "./state";
import type { BetSpotHandle } from "./bet-spot";
import { mountBetSpot } from "./bet-spot";
import type { BetHistory, BetKind, BetTotals } from "./types";

export interface BetLayoutHandle {
  element: HTMLElement;
  wagers(): BetTotals;
  clearAll(): void;
  rebet(history?: BetHistory): boolean;
  lock(locked: boolean): void;
  lockSpot(kind: BetKind, locked: boolean): void;
  place(kind: BetKind, amount: number): boolean;
  removeLast(kind?: BetKind): BetKind | undefined;
  getLastTouched(): BetKind | undefined;
  snapshot(): BetHistory;
  setCanPlace(fn: (amount: number) => boolean): void;
  flashOverspend(kind: BetKind): void;
  settle(multipliers: Partial<Record<BetKind, number>>): void;
  clearSettlement(): void;
  focusSpot(kind: BetKind): void;
}

interface BetLayoutOptions {
  onSpotInteraction?: (kind: BetKind) => void;
  onInvalidBet?: (kind: BetKind, amount: number) => void;
  canPlace?: (amount: number) => boolean;
  getSelectedAmount?: () => number;
}

interface SpotMeta {
  kind: BetKind;
  name: string;
  odds: string;
  tone: string;
  footnote?: string;
  translateY: number;
  width: string;
}

const SPOTS: SpotMeta[] = [
  { kind: "panda", name: "Panda 8", odds: "25:1", tone: "var(--panda-bamboo)", translateY: 14, width: "152px" },
  { kind: "player", name: "Player", odds: "1:1", tone: "var(--player)", translateY: 0, width: "208px" },
  { kind: "tie", name: "Tie", odds: "8:1", tone: "var(--tie)", translateY: 22, width: "168px" },
  {
    kind: "banker",
    name: "Banker",
    odds: "1:1",
    tone: "var(--banker)",
    footnote: "DRAGON PUSHES",
    translateY: 0,
    width: "208px",
  },
  { kind: "dragon", name: "Dragon 7", odds: "40:1", tone: "var(--dragon)", translateY: 14, width: "152px" },
];

export function mountBetLayout(host: HTMLElement, options: BetLayoutOptions = {}): BetLayoutHandle {
  const container = document.createElement("div");
  container.id = "row-bets";
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Bets");

  const spotHandles: Record<BetKind, BetSpotHandle | null> = {
    panda: null,
    player: null,
    tie: null,
    banker: null,
    dragon: null,
  };

  let canPlace: (amount: number) => boolean = options.canPlace ?? (() => true);
  let lastTouched: BetKind | undefined;

  const setLastTouched = (kind: BetKind) => {
    lastTouched = kind;
  };

  const flashSpot = (kind: BetKind) => {
    const handle = spotHandles[kind];
    if (!handle) {
      return;
    }
    handle.element.classList.add("danger-flash");
    window.setTimeout(() => handle.element.classList.remove("danger-flash"), 180);
  };

  const updateLabels = () => {
    (Object.keys(spotHandles) as BetKind[]).forEach((kind) => {
      spotHandles[kind]?.setLabel();
    });
  };

  const totals = (): BetTotals => ({
    player: spotHandles.player?.total() ?? 0,
    banker: spotHandles.banker?.total() ?? 0,
    tie: spotHandles.tie?.total() ?? 0,
    dragon: spotHandles.dragon?.total() ?? 0,
    panda: spotHandles.panda?.total() ?? 0,
  });

  for (const [index, config] of SPOTS.entries()) {
    const wrapper = document.createElement("div");
    wrapper.className = "spot-wrap";
    wrapper.style.setProperty("--spot-y", `${config.translateY}px`);
    wrapper.style.setProperty("--spot-width", config.width);

    const spot = mountBetSpot(wrapper, config);
    spot.element.tabIndex = index + 7;
    spotHandles[config.kind] = spot;
    container.append(wrapper);

    const addFromSelection = () => {
      const amount = options.getSelectedAmount?.() ?? 1;
      if (!canPlace(amount)) {
        flashSpot(config.kind);
        options.onInvalidBet?.(config.kind, amount);
        return;
      }
      spot.add(amount);
      setLastTouched(config.kind);
      updateLabels();
      options.onSpotInteraction?.(config.kind);
    };

    const removeOne = () => {
      if (spot.removeLast() !== undefined) {
        setLastTouched(config.kind);
        updateLabels();
        options.onSpotInteraction?.(config.kind);
      }
    };

    spot.element.addEventListener("click", (event) => {
      if (!(event instanceof MouseEvent)) {
        return;
      }
      if (event.shiftKey || event.button === 2) {
        removeOne();
        return;
      }
      addFromSelection();
    });

    spot.element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      removeOne();
    });
  }

  host.append(container);
  updateLabels();

  return {
    element: container,
    wagers: totals,
    clearAll() {
      (Object.keys(spotHandles) as BetKind[]).forEach((kind) => {
        spotHandles[kind]?.clear();
      });
      lastTouched = undefined;
      updateLabels();
    },
    rebet(history) {
      const next = cloneBetHistory(history);
      const previous = this.snapshot();

      this.clearAll();

      for (const kind of Object.keys(next) as BetKind[]) {
        for (const amount of next[kind]) {
          if (!canPlace(amount)) {
            this.clearAll();
            for (const restoreKind of Object.keys(previous) as BetKind[]) {
              previous[restoreKind].forEach((value) => {
                spotHandles[restoreKind]?.add(value);
              });
            }
            updateLabels();
            flashSpot(kind);
            return false;
          }
          spotHandles[kind]?.add(amount);
          setLastTouched(kind);
        }
      }

      updateLabels();
      return true;
    },
    lock(locked) {
      (Object.keys(spotHandles) as BetKind[]).forEach((kind) => {
        spotHandles[kind]?.setLocked(locked);
      });
    },
    lockSpot(kind, locked) {
      spotHandles[kind]?.setLocked(locked);
    },
    place(kind, amount) {
      const handle = spotHandles[kind];
      if (!handle) {
        return false;
      }
      if (!canPlace(amount)) {
        flashSpot(kind);
        options.onInvalidBet?.(kind, amount);
        return false;
      }
      handle.add(amount);
      setLastTouched(kind);
      updateLabels();
      options.onSpotInteraction?.(kind);
      return true;
    },
    removeLast(kind) {
      const target = kind ?? lastTouched;
      if (!target) {
        return undefined;
      }
      const removed = spotHandles[target]?.removeLast();
      if (removed === undefined) {
        return undefined;
      }
      setLastTouched(target);
      updateLabels();
      options.onSpotInteraction?.(target);
      return target;
    },
    getLastTouched() {
      return lastTouched;
    },
    snapshot() {
      return cloneBetHistory({
        player: spotHandles.player?.snapshots() ?? [],
        banker: spotHandles.banker?.snapshots() ?? [],
        tie: spotHandles.tie?.snapshots() ?? [],
        dragon: spotHandles.dragon?.snapshots() ?? [],
        panda: spotHandles.panda?.snapshots() ?? [],
      });
    },
    setCanPlace(fn) {
      canPlace = fn;
    },
    flashOverspend(kind) {
      flashSpot(kind);
    },
    settle(multipliers) {
      (Object.keys(spotHandles) as BetKind[]).forEach((kind) => {
        const handle = spotHandles[kind];
        if (!handle || handle.total() === 0) {
          handle?.settle("idle");
          return;
        }
        const payout = multipliers[kind] ?? -1;
        if (payout > 0) {
          handle.settle("win");
        } else if (payout === 0) {
          handle.settle("push");
        } else {
          handle.settle("loss");
        }
      });
    },
    clearSettlement() {
      (Object.keys(spotHandles) as BetKind[]).forEach((kind) => {
        if ((spotHandles[kind]?.total() ?? 0) > 0) {
          spotHandles[kind]?.settle("idle");
        }
      });
      updateLabels();
    },
    focusSpot(kind) {
      spotHandles[kind]?.focus();
    },
  };
}
