import { formatCurrency } from "./types";
import { applyBankrollDelta, DEFAULT_BANKROLL } from "./state";
import { readStoredItem } from "./storage";

export interface BankrollHandle {
  element: HTMLElement;
  get(): number;
  apply(delta: number): number;
  requestReload(): boolean;
  setReloadLocked(locked: boolean): void;
}

const STORAGE_KEY = "ezbac.bankroll";

interface BankrollDeps {
  onReloadRequested?: () => void;
}

function animateValue(from: number, to: number, el: HTMLElement, formatter: (value: number) => string) {
  const diff = to - from;
  if (diff === 0) {
    el.textContent = formatter(to);
    return;
  }

  const start = performance.now();
  const duration = 300;
  const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

  const frame = (now: number) => {
    const ratio = Math.min(1, (now - start) / duration);
    const next = from + diff * easeOut(ratio);
    el.textContent = formatter(Math.round(next));

    if (ratio < 1) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
}

export function mountBankroll(host: HTMLElement, deps: BankrollDeps = {}): BankrollHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "bankroll";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "BANKROLL";

  const value = document.createElement("span");
  value.className = "value";

  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.className = "bankroll-reload";
  reloadButton.textContent = "Add $1,000 play chips";
  reloadButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      deps.onReloadRequested?.();
    }
  });
  reloadButton.addEventListener("click", () => deps.onReloadRequested?.());

  wrapper.append(label, value, reloadButton);
  host.append(wrapper);

  const fromStorage = Number.parseInt(readStoredItem(STORAGE_KEY) ?? "", 10);
  const safe = Number.isFinite(fromStorage) ? fromStorage : DEFAULT_BANKROLL;
  let bankroll = Math.max(0, safe);
  let reloadLocked = false;
  value.textContent = formatCurrency(bankroll);

  const syncReload = () => {
    reloadButton.hidden = bankroll !== 0 || reloadLocked;
    reloadButton.disabled = bankroll !== 0 || reloadLocked;
  };
  syncReload();

  const persist = (next: number) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, `${next}`);
    } catch {
      // ignore storage errors
    }
  };

  return {
    element: wrapper,
    get() {
      return bankroll;
    },
    apply(delta) {
      const next = applyBankrollDelta(bankroll, delta);
      animateValue(bankroll, next, value, formatCurrency);
      bankroll = next;
      syncReload();
      value.classList.remove("anim-total-tick");
      void value.offsetWidth;
      value.classList.add("anim-total-tick");
      persist(bankroll);
      return bankroll;
    },
    requestReload() {
      if (bankroll !== 0 || reloadLocked) {
        return false;
      }
      bankroll = DEFAULT_BANKROLL;
      value.textContent = formatCurrency(bankroll);
      syncReload();
      persist(bankroll);
      return true;
    },
    setReloadLocked(locked) {
      reloadLocked = locked;
      syncReload();
    },
  };
}
