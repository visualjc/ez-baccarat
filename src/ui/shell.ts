import type { GameMode } from "./types";

export interface ShellHandle {
  app: HTMLElement;
  tableHost: HTMLElement;
  panelSlot: HTMLElement;
  status: HTMLElement;
  controls: {
    newShoe: HTMLButtonElement;
    modeToggle: HTMLButtonElement;
    helpButton: HTMLButtonElement;
    seedChip: HTMLSpanElement;
    shoeRemainingText: HTMLSpanElement;
    shoeMeterFill: HTMLSpanElement;
  };
  setMode(mode: GameMode): void;
  announce(message: string): void;
  setSeedLabel(label: string): void;
  setCardsRemaining(remaining: number, total?: number): void;
}

export function mountShell(host: HTMLElement = document.body): ShellHandle {
  const app = document.createElement("div");
  app.id = "app";

  const header = document.createElement("header");
  header.id = "app-header";

  const wordmark = document.createElement("h1");
  wordmark.className = "wordmark";
  wordmark.textContent = "EZ BACCARAT";

  const meterWrap = document.createElement("div");
  meterWrap.className = "shoe-meter";

  const meterText = document.createElement("span");
  meterText.className = "shoe-meter-text";
  const meterBar = document.createElement("span");
  meterBar.className = "shoe-meter-bar";
  const meterFill = document.createElement("span");
  meterFill.className = "shoe-meter-fill";
  meterBar.append(meterFill);
  meterWrap.append(meterText, meterBar);

  const seedChip = document.createElement("span");
  seedChip.className = "seed-chip";

  const headerControls = document.createElement("div");
  headerControls.className = "header-controls";

  const newShoeButton = document.createElement("button");
  newShoeButton.type = "button";
  newShoeButton.className = "header-button";
  newShoeButton.textContent = "New Shoe";

  const modeToggle = document.createElement("button");
  modeToggle.type = "button";
  modeToggle.className = "mode-toggle";
  modeToggle.setAttribute("aria-label", "Toggle Trainer or Casino mode");
  const trainerText = document.createElement("span");
  trainerText.textContent = "Trainer";
  const casinoText = document.createElement("span");
  casinoText.textContent = "Casino";
  modeToggle.append(trainerText, casinoText);

  const helpButton = document.createElement("button");
  helpButton.type = "button";
  helpButton.className = "header-button help";
  helpButton.textContent = "?";

  headerControls.append(seedChip, newShoeButton, modeToggle, helpButton);
  header.append(wordmark, meterWrap, headerControls);

  const main = document.createElement("main");
  main.id = "app-main";

  const tableHost = document.createElement("section");
  tableHost.id = "table-view-host";

  const panelSlot = document.createElement("aside");
  panelSlot.id = "panel-slot";
  const placeholder = document.createElement("div");
  placeholder.className = "panel-placeholder";
  placeholder.textContent = "Count panel";
  panelSlot.append(placeholder);

  main.append(tableHost, panelSlot);

  const status = document.createElement("div");
  status.id = "app-status";
  status.role = "status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Ready.";

  app.append(header, main, status);
  host.replaceChildren(app);

  return {
    app,
    tableHost,
    panelSlot,
    status,
    controls: {
      newShoe: newShoeButton,
      modeToggle,
      helpButton,
      seedChip,
      shoeRemainingText: meterText,
      shoeMeterFill: meterFill,
    },
    setMode(mode) {
      app.dataset.mode = mode;
      app.style.setProperty("--panel-w", mode === "casino" ? "0px" : "380px");
      panelSlot.style.visibility = mode === "casino" ? "hidden" : "visible";
      modeToggle.dataset.mode = mode;
      modeToggle.setAttribute("aria-pressed", String(mode === "casino"));
    },
    announce(message) {
      status.textContent = "";
      window.requestAnimationFrame(() => {
        status.textContent = message;
      });
    },
    setSeedLabel(label) {
      seedChip.textContent = label;
    },
    setCardsRemaining(remaining, total = 416) {
      meterText.textContent = `${remaining} / ${total}`;
      const percentage = total <= 0 ? 0 : Math.max(0, Math.min(100, (remaining / total) * 100));
      meterFill.style.width = `${percentage.toFixed(2)}%`;
    },
  };
}
