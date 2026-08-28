import { cardsRemaining } from "../engine/shoe";
import { createEngine, dealRound, type EngineState, type RoundResult } from "../engine/engine";
import { createBus } from "./bus";
import { mountKeyboard } from "./keyboard";
import { formatSeedChip } from "./seed";
import { mountShell } from "./shell";
import { mountCountPanel } from "./count-panel";
import { canRestoreHistory, cloneBetHistory, planDoubleWager, totalWager } from "./state";
import { mountTableView } from "./table-view";
import type { BetHistory, BetKind, GameMode } from "./types";
import { formatCurrency, formatNet } from "./types";

export interface GameHandle {
  mode: GameMode;
  newShoe(seed?: string, force?: boolean): Promise<void>;
  deal(): Promise<void>;
  toggleMode(): void;
  clearBets(): void;
  rebet(): void;
  doubleBets(): void;
  removeLastBet(): void;
  requestPlayChips(): boolean;
  destroy(): void;
}

interface GameDeps {
  seed?: string;
  mountPoint?: HTMLElement;
}

function describeSettlement(result: RoundResult, net: number): string {
  const { settlement } = result;

  if (settlement.isDragon) {
    return `Banker 7 with three cards. Banker pushes, Dragon 7 pays 40 to 1. Net ${formatNet(net)}.`;
  }
  if (settlement.isPanda) {
    return `Player 8 with three cards. Panda 8 pays 25 to 1. Net ${formatNet(net)}.`;
  }
  if (settlement.outcome === "tie") {
    return `Tie ${settlement.playerTotal} to ${settlement.bankerTotal}. Tie pays 8 to 1. Net ${formatNet(net)}.`;
  }

  const winner = settlement.outcome === "player" ? "Player" : "Banker";
  const winnerTotal = settlement.outcome === "player" ? settlement.playerTotal : settlement.bankerTotal;
  const loserTotal = settlement.outcome === "player" ? settlement.bankerTotal : settlement.playerTotal;
  return `${winner} ${winnerTotal} over ${loserTotal}. Net ${formatNet(net)}.`;
}

export function mountGame(deps: GameDeps = {}): GameHandle {
  const bus = createBus();
  const shell = mountShell(deps.mountPoint ?? document.body);

  const state = {
    mode: "trainer" as GameMode,
    engine: null as EngineState | null,
    round: 1,
    lastHistory: undefined as BetHistory | undefined,
    busy: false,
    seed: deps.seed,
  };

  const table = mountTableView(shell.tableHost, {
    bus,
    announce: shell.announce,
    onWagersChanged: () => syncControls(),
    onPlayChipsRequested: () => { gameHandle.requestPlayChips(); },
  });
  const panel = mountCountPanel(shell.panelSlot, bus);

  const syncCardsRemaining = () => {
    const remaining = state.engine ? cardsRemaining(state.engine.shoe) : 0;
    shell.setCardsRemaining(remaining, 416);
    table.setCardsRemaining(remaining, 416);
  };

  const syncControls = () => {
    const wagers = table.betLayout.snapshot();
    const bankroll = table.bankroll.get();
    const hasWagers = totalWager(wagers) > 0;
    const canRebet = canRestoreHistory(bankroll, state.lastHistory);

    const doublePlan = planDoubleWager(bankroll, wagers, state.lastHistory);

    table.controls.setBusy(state.busy);
    table.controls.setDealEnabled(hasWagers && bankroll > 0);
    table.controls.clearButton.disabled = state.busy || !hasWagers;
    table.controls.rebetButton.disabled = state.busy || !canRebet;
    table.controls.doubleButton.disabled = state.busy || !doublePlan.ok;
    table.betLayout.lock(state.busy);
    table.chipTray.setLocked(state.busy);
    table.bankroll.setReloadLocked(state.busy);
    shell.controls.newShoe.disabled = state.busy;
  };

  const setMode = (mode: GameMode) => {
    state.mode = mode;
    gameHandle.mode = mode;
    shell.setMode(mode);
    bus.emit({ type: "mode:changed", mode });
  };

  const keyboard = mountKeyboard({
    isBusy: () => state.busy,
    bet: (kind) => {
      if (table.placeBet(kind, table.chipTray.selected())) {
        table.betLayout.focusSpot(kind);
        syncControls();
      }
    },
    selectChip: (value) => table.chipTray.select(value),
    deal: () => {
      if (state.busy) {
        table.fastForward();
        panel.fastForward();
        return;
      }
      void gameHandle.deal();
    },
    fastForward: () => { table.fastForward(); panel.fastForward(); },
    clear: () => {
      if (!state.busy) {
        gameHandle.clearBets();
      }
    },
    rebet: () => {
      if (!state.busy) {
        gameHandle.rebet();
      }
    },
    double: () => {
      if (!state.busy) {
        gameHandle.doubleBets();
      }
    },
    newShoe: () => {
      if (!state.busy) {
        void gameHandle.newShoe(state.seed, false);
      }
    },
    removeLast: () => {
      if (!state.busy) {
        gameHandle.removeLastBet();
      }
    },
    toggleMode: () => {
      if (!state.busy) {
        gameHandle.toggleMode();
      }
    },
    dismiss: () => {
      if (state.busy) {
        table.fastForward();
        panel.fastForward();
      } else {
        table.outcomeBanner.hide();
      }
    },
    help: () => {
      window.dispatchEvent(new CustomEvent("ezb:help"));
      shell.announce("Help requested.");
    },
  });

  const gameHandle: GameHandle = {
    mode: state.mode,
    async newShoe(seed, force = false) {
      if (!force && state.engine && !state.engine.shoe.retired) {
        const confirmed = window.confirm("Start a new shoe?");
        if (!confirmed) {
          return;
        }
      }

      state.seed = seed ?? state.seed;
      shell.setSeedLabel(formatSeedChip(state.seed));
      table.clearRound();
      table.setRoundNumber(1);

      state.engine = createEngine({
        seed: state.seed,
        decks: 8,
        cutOffset: 14,
        shuffle: true,
      });
      state.round = 1;
      state.busy = true;
      syncCardsRemaining();
      syncControls();

      bus.emit({
        type: "shoe:opened",
        exposedBurnCard: state.engine.exposedBurnCard,
        unseenBurnCount: state.engine.unseenBurnCards.length,
        cardsRemaining: cardsRemaining(state.engine.shoe),
        openingCounts: state.engine.openingCounts,
      });

      await table.shoe.shake();
      await table.showBurn(state.engine.exposedBurnCard, state.engine.unseenBurnCards.length);

      state.busy = false;
      syncCardsRemaining();
      syncControls();
      shell.announce("New shoe opened.");
    },
    async deal() {
      if (state.busy) {
        table.fastForward();
        panel.fastForward();
        return;
      }

      if (!state.engine) {
        await gameHandle.newShoe(state.seed, true);
      }
      if (!state.engine) {
        return;
      }
      if (state.engine.shoe.retired) {
        shell.announce("Shoe retired. Start a new shoe.");
        return;
      }

      const wagers = table.betLayout.snapshot();
      if (totalWager(wagers) === 0) {
        shell.announce("No wagers placed.");
        return;
      }

      table.clearRound();
      table.setRoundNumber(state.round);
      bus.emit({ type: "round:start", round: state.round });

      state.busy = true;
      syncControls();

      const roundResult = dealRound(state.engine);
      syncCardsRemaining();

      const settled = await table.playRound(roundResult, wagers);
      const bankroll = table.bankroll.apply(settled.net);
      state.lastHistory = cloneBetHistory(wagers);

      bus.emit({ type: "bankroll:changed", bankroll, delta: settled.net });
      bus.emit({
        type: "round:settled",
        result: roundResult,
        cardsRemaining: cardsRemaining(state.engine.shoe),
      });

      shell.announce(describeSettlement(roundResult, settled.net));

      if (state.engine.shoe.retired) {
        bus.emit({ type: "shoe:retired" });
      }

      state.round += 1;
      state.busy = false;
      syncCardsRemaining();
      syncControls();

      if (state.engine.shoe.retired) {
        window.setTimeout(() => {
          shell.announce("Shoe retired. Start a new shoe to continue.");
        }, 400);
      }
    },
    toggleMode() {
      setMode(state.mode === "trainer" ? "casino" : "trainer");
    },
    clearBets() {
      table.betLayout.clearAll();
      syncControls();
    },
    doubleBets() {
      const plan = planDoubleWager(
        table.bankroll.get(),
        table.betLayout.snapshot(),
        state.lastHistory,
      );

      if (!plan.ok) {
        shell.announce(
          plan.reason === "bankroll"
            ? "Doubling would exceed bankroll."
            : "No wagers to double.",
        );
        return;
      }

      // rebet() re-places chip by chip through the live bankroll predicate and
      // rolls back if any chip is refused, so the over-wager hole stays shut
      // even though the plan already checked the total.
      if (!table.betLayout.rebet(plan.history)) {
        shell.announce("Doubling would exceed bankroll.");
        syncControls();
        return;
      }

      shell.announce(
        plan.source === "last"
          ? `Last wagers doubled to ${formatCurrency(plan.total)}.`
          : `Wagers doubled to ${formatCurrency(plan.total)}.`,
      );
      syncControls();
    },
    rebet() {
      if (!state.lastHistory) {
        shell.announce("No previous wagers to restore.");
        return;
      }
      if (!table.betLayout.rebet(state.lastHistory)) {
        shell.announce("Previous wagers exceed bankroll.");
        syncControls();
        return;
      }
      syncControls();
    },
    removeLastBet() {
      const kind = table.removeLastBet();
      if (kind) {
        shell.announce(`Removed one chip from ${kind}.`);
        syncControls();
      }
    },
    requestPlayChips() {
      if (state.busy || !table.bankroll.requestReload()) {
        return false;
      }

      const bankroll = table.bankroll.get();
      bus.emit({ type: "bankroll:changed", bankroll, delta: bankroll });
      syncControls();
      shell.announce("Added $1,000 in play chips.");
      return true;
    },
    destroy() {
      keyboard.detach();
      table.destroy();
      panel.destroy();
      shell.app.remove();
    },
  };

  table.controls.clearButton.addEventListener("click", () => gameHandle.clearBets());
  table.controls.rebetButton.addEventListener("click", () => gameHandle.rebet());
  table.controls.doubleButton.addEventListener("click", () => gameHandle.doubleBets());
  table.controls.dealButton.addEventListener("click", () => {
    if (state.busy) {
      table.fastForward();
      panel.fastForward();
      return;
    }
    void gameHandle.deal();
  });
  shell.controls.newShoe.addEventListener("click", () => {
    void gameHandle.newShoe(state.seed, false);
  });
  shell.controls.modeToggle.addEventListener("click", () => gameHandle.toggleMode());
  shell.controls.helpButton.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("ezb:help"));
    shell.announce("Help requested.");
  });

  setMode("trainer");
  syncControls();
  shell.setSeedLabel(formatSeedChip(state.seed));
  void gameHandle.newShoe(state.seed, true);

  return gameHandle;
}
