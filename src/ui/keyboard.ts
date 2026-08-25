import type { BetKind } from "./types";

export interface KeyboardHandlers {
  bet: (kind: BetKind) => void;
  selectChip: (value: number) => void;
  deal: () => void;
  fastForward: () => void;
  clear: () => void;
  rebet: () => void;
  newShoe: () => void;
  removeLast: () => void;
  toggleMode: () => void;
  dismiss: () => void;
  help: () => void;
  isBusy?: () => boolean;
}

export function mountKeyboard(handlers: KeyboardHandlers) {
  const listener = (event: KeyboardEvent) => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }

    const key = event.key.toLowerCase();
    const busy = handlers.isBusy?.() ?? false;

    if (key === " " || key === "enter") {
      event.preventDefault();
      handlers.deal();
      return;
    }

    if (busy) {
      if (key === "escape") {
        handlers.dismiss();
      }
      return;
    }

    if (key === "p") {
      handlers.bet("player");
      return;
    }
    if (key === "b") {
      handlers.bet("banker");
      return;
    }
    if (key === "t") {
      handlers.bet("tie");
      return;
    }
    if (key === "7") {
      handlers.bet("dragon");
      return;
    }
    if (key === "8") {
      handlers.bet("panda");
      return;
    }

    if (key === "1") handlers.selectChip(1);
    else if (key === "2") handlers.selectChip(5);
    else if (key === "3") handlers.selectChip(25);
    else if (key === "4") handlers.selectChip(100);
    else if (key === "5") handlers.selectChip(500);
    else if (key === "6") handlers.selectChip(1000);
    else if (key === "c") handlers.clear();
    else if (key === "r") handlers.rebet();
    else if (key === "s") handlers.newShoe();
    else if (key === "m") handlers.toggleMode();
    else if (key === "backspace") handlers.removeLast();
    else if (key === "?" || key === "/") handlers.help();
    else if (key === "escape") handlers.dismiss();
  };

  document.addEventListener("keydown", listener);

  return {
    detach() {
      document.removeEventListener("keydown", listener);
    },
  };
}
