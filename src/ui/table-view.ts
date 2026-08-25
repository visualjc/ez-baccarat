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
import { canPlaceChip, computeBetMultipliers, settlementNet } from "./state";
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

export function buildTimeline(result: RoundResult): TimelineStep[] {
  const current = { player: 0, banker: 0 };
  const makeStep = (seat: "player" | "banker", index: number, isThird: boolean, ruleText?: string): TimelineStep => {
    current[seat] = seat === "player"
      ? result.presentation.playerRunningTotals[index]!
      : result.presentation.bankerRunningTotals[index]!;
    return {
      seat,
      card: (seat === "player" ? result.playerCards : result.bankerCards)[index]!,
      index,
      isThird,
      ruleText,
      playerTotal: current.player,
      bankerTotal: current.banker,
    };
  };
  const ordered: TimelineStep[] = [
    makeStep("player", 0, false),
    makeStep("banker", 0, false),
    makeStep("player", 1, false),
    makeStep("banker", 1, false),
  ];

  if (result.playerCards[2]) {
    ordered.push(makeStep("player", 2, true, result.presentation.playerThirdNarration));
  }

  if (result.bankerCards[2]) {
    ordered.push(makeStep("banker", 2, true, result.presentation.bankerThirdNarration));
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
  betLayout.setCanPlace((amount) => canPlaceChip(bankroll.get(), betLayout.snapshot(), amount));

  const celebrationLayer = document.createElement("div");
  celebrationLayer.id = "celebration-layer";
  const burnLayer = document.createElement("div");
  burnLayer.id = "burn-layer";
  const bannerLayer = document.createElement("div");
  bannerLayer.id = "banner-layer";

  const celebration = mountCelebration(celebrationLayer);
  const burnRitual = mountBurnRitual(burnLayer, deps.announce);
  const outcomeBanner = mountOutcomeBanner(bannerLayer);

  rowTray.append(bankrollHost, chipHost, actionHost);
  wrapper.append(rowShoe, rowHands, betHost, rowTray, celebrationLayer, burnLayer, bannerLayer);
  host.replaceChildren(wrapper);

  let busy = false;
  let payoutTimer: number | undefined;
  let payoutResolve: (() => void) | undefined;
  let fastForwarding = false;

  const waitForPayout = (ms: number) => new Promise<void>((resolve) => {
    payoutResolve = resolve;
    payoutTimer = window.setTimeout(() => {
      payoutTimer = undefined;
      payoutResolve = undefined;
      resolve();
    }, fastForwarding ? 1 : ms);
  });

  const resolvePayoutWait = () => {
    if (payoutTimer !== undefined) {
      window.clearTimeout(payoutTimer);
      payoutTimer = undefined;
    }
    const resolve = payoutResolve;
    payoutResolve = undefined;
    resolve?.();
  };

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
      fastForwarding = false;
      outcomeBanner.resetPlayback();
      try {
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

        await waitForPayout(Math.max(parseDuration("--dur-sweep"), parseDuration("--dur-pay")));
        betLayout.clearAll();
        betLayout.clearSettlement();
        deps.onWagersChanged?.();
        return { net, multipliers };
      } finally {
        busy = false;
        fastForwarding = false;
        wrapper.classList.remove("speed-fast");
      }
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
      fastForwarding = true;
      timeline.fastForward();
      outcomeBanner.fastForward();
      resolvePayoutWait();
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
