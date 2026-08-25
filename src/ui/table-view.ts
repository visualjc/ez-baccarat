import type { Card } from "../engine/card";
import type { RoundResult } from "../engine/engine";
import { mountBankroll } from "./bankroll";
import { mountBetLayout } from "./bet-layout";
import { mountBurnRitual } from "./burn-ritual";
import type { GameBus } from "./bus";
import { mountCelebration } from "./celebration";
import { mountChipTray } from "./chip-tray";
import { mountControls } from "./controls";
import { mountHandZone } from "./hand-zone";
import { mountOutcomeBanner } from "./outcome-banner";
import { mountRoundTimeline, type TimelineStep } from "./round-timeline";
import { computeBetMultipliers, settlementNet } from "./state";
import { mountShoe } from "./shoe-box";
import type { BetHistory, BetKind } from "./types";

interface TableViewDeps {
  bus: GameBus;
  announce(text: string): void;
  onWagersChanged?: () => void;
}

export interface TableViewHandle {
  host: HTMLElement;
  shoe: ReturnType<typeof mountShoe>;
  playerHand: ReturnType<typeof mountHandZone>;
  bankerHand: ReturnType<typeof mountHandZone>;
  betLayout: ReturnType<typeof mountBetLayout>;
  chipTray: ReturnType<typeof mountChipTray>;
  controls: ReturnType<typeof mountControls>;
  bankroll: ReturnType<typeof mountBankroll>;
  outcomeBanner: ReturnType<typeof mountOutcomeBanner>;
  celebration: ReturnType<typeof mountCelebration>;
  burnRitual: ReturnType<typeof mountBurnRitual>;
  playRound(result: RoundResult, wagers: BetHistory): Promise<{ net: number; multipliers: Partial<Record<BetKind, number>> }>;
  showBurn(exposedCard: Card, burnCount: number): Promise<void>;
  setCardsRemaining(remaining: number, total?: number): void;
  clearRound(): void;
  setRoundNumber(round: number): void;
  fastForward(): void;
  isBusy(): boolean;
  destroy(): void;
  placeBet(kind: BetKind, amount: number): boolean;
  removeLastBet(kind?: BetKind): BetKind | undefined;
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

function total(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + card.value, 0) % 10;
}

function thirdCardRule(result: RoundResult, seat: "player" | "banker"): string | undefined {
  if (seat === "player" && result.playerCards.length === 3) {
    return `Player ${total(result.playerCards.slice(0, 2))} draws on 0-5`;
  }

  if (seat === "banker" && result.bankerCards.length === 3) {
    const bankerInitial = total(result.bankerCards.slice(0, 2));
    if (result.playerCards.length === 3) {
      return `Banker ${bankerInitial} draws vs Player third ${result.playerCards[2].value % 10}`;
    }
    return `Banker ${bankerInitial} draws with Player standing`;
  }

  return undefined;
}

function buildTimeline(result: RoundResult): TimelineStep[] {
  const ordered: TimelineStep[] = [
    { seat: "player", card: result.playerCards[0], index: 0, isThird: false },
    { seat: "banker", card: result.bankerCards[0], index: 0, isThird: false },
    { seat: "player", card: result.playerCards[1], index: 1, isThird: false },
    { seat: "banker", card: result.bankerCards[1], index: 1, isThird: false },
  ];

  if (result.playerCards[2]) {
    ordered.push({
      seat: "player",
      card: result.playerCards[2],
      index: 2,
      isThird: true,
      ruleText: thirdCardRule(result, "player"),
    });
  }

  if (result.bankerCards[2]) {
    ordered.push({
      seat: "banker",
      card: result.bankerCards[2],
      index: 2,
      isThird: true,
      ruleText: thirdCardRule(result, "banker"),
    });
  }

  return ordered;
}

export function mountTableView(host: HTMLElement, deps: TableViewDeps): TableViewHandle {
  const wrapper = document.createElement("section");
  wrapper.id = "table-view";
  wrapper.className = "felt";

  const rowShoe = document.createElement("div");
  rowShoe.id = "row-shoe";

  const rowHands = document.createElement("div");
  rowHands.id = "row-hands";

  const rowTray = document.createElement("div");
  rowTray.id = "row-tray";

  const betHost = document.createElement("div");
  betHost.id = "row-bets-wrap";

  const playerHost = document.createElement("div");
  const bankerHost = document.createElement("div");

  const divider = document.createElement("div");
  divider.className = "hand-divider";
  const roundNumber = document.createElement("span");
  roundNumber.id = "round-number";
  roundNumber.textContent = "#1";
  divider.append(roundNumber);

  rowHands.append(playerHost, divider, bankerHost);

  const shoe = mountShoe(rowShoe);
  const playerHand = mountHandZone(playerHost, "player");
  const bankerHand = mountHandZone(bankerHost, "banker");

  const bankrollHost = document.createElement("div");
  bankrollHost.className = "tray-bankroll";
  const chipHost = document.createElement("div");
  chipHost.className = "tray-chips";
  const actionHost = document.createElement("div");
  actionHost.className = "tray-actions";

  const bankroll = mountBankroll(bankrollHost);
  const chipTray = mountChipTray(chipHost);
  const controls = mountControls(actionHost);
  const betLayout = mountBetLayout(betHost, {
    getSelectedAmount: () => chipTray.selected(),
    onSpotInteraction: () => deps.onWagersChanged?.(),
    onInvalidBet: () => deps.announce("Wager exceeds bankroll."),
  });

  const celebrationLayer = document.createElement("div");
  celebrationLayer.id = "celebration-layer";
  const burnLayer = document.createElement("div");
  burnLayer.id = "burn-layer";
  const bannerLayer = document.createElement("div");
  bannerLayer.id = "banner-layer";

  const celebration = mountCelebration(celebrationLayer);
  const burnRitual = mountBurnRitual(burnLayer, shoe.burnReadoutElement, deps.announce);
  const outcomeBanner = mountOutcomeBanner(bannerLayer);

  rowTray.append(bankrollHost, chipHost, actionHost);
  wrapper.append(rowShoe, rowHands, betHost, rowTray, celebrationLayer, burnLayer, bannerLayer);
  host.replaceChildren(wrapper);

  let busy = false;

  const timeline = mountRoundTimeline({
    tableElement: wrapper,
    originRect: () => shoe.originRect(),
    hands: { player: playerHand, banker: bankerHand },
    onCardSeen: (seat, card, index, isThird) => {
      deps.bus.emit({ type: "card:seen", card, seat, index });
      const ordinal = isThird ? "third card" : `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} card`;
      deps.announce(`${seat === "player" ? "Player" : "Banker"} ${ordinal} ${card.rank}.`);
    },
    onTotals: (playerTotal, bankerTotal) => {
      playerHand.setTotal(playerTotal);
      bankerHand.setTotal(bankerTotal);
    },
    onThird: (seat, text) => {
      const hand = seat === "player" ? playerHand : bankerHand;
      hand.emphasizeThird(text);
      window.setTimeout(() => hand.emphasizeThird(null), 1400);
    },
  });

  wrapper.addEventListener("pointerdown", () => {
    if (busy) {
      timeline.fastForward();
    }
  });

  return {
    host: wrapper,
    shoe,
    playerHand,
    bankerHand,
    betLayout,
    chipTray,
    controls,
    bankroll,
    outcomeBanner,
    celebration,
    burnRitual,
    async playRound(result, wagers) {
      busy = true;
      const steps = buildTimeline(result);
      await timeline.play(steps);

      const multipliers = computeBetMultipliers(wagers, result.settlement);
      const net = settlementNet(wagers, result.settlement);

      await outcomeBanner.show(result.settlement, net);
      betLayout.settle(multipliers);

      if (result.settlement.isDragon) {
        celebration.dragon(bankerHand.element.getBoundingClientRect());
      }
      if (result.settlement.isPanda) {
        celebration.panda(playerHand.element.getBoundingClientRect());
      }

      await wait(parseDuration("--dur-pay") + 180);
      betLayout.clearAll();
      betLayout.clearSettlement();
      deps.onWagersChanged?.();
      busy = false;

      return { net, multipliers };
    },
    async showBurn(exposedCard, burnCount) {
      busy = true;
      await burnRitual.run(exposedCard, burnCount);
      busy = false;
    },
    setCardsRemaining(remaining, total = 416) {
      shoe.setRemaining(remaining, total);
      shoe.setDiscardCount(Math.max(0, total - remaining));
    },
    clearRound() {
      playerHand.clear();
      bankerHand.clear();
      celebration.clear();
      burnRitual.clear();
      outcomeBanner.hide();
    },
    setRoundNumber(round) {
      roundNumber.textContent = `#${round}`;
    },
    fastForward() {
      timeline.fastForward();
    },
    isBusy() {
      return busy || timeline.isBusy();
    },
    destroy() {
      timeline.destroy();
      wrapper.remove();
    },
    placeBet(kind, amount) {
      return betLayout.place(kind, amount);
    },
    removeLastBet(kind) {
      return betLayout.removeLast(kind);
    },
  };
}
