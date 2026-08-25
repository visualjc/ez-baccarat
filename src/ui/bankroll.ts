import { formatCurrency } from "./types";
import { applyBankrollDelta, DEFAULT_BANKROLL } from "./state";

export interface BankrollHandle {
  element: HTMLElement;
  get(): number;
  apply(delta: number): number;
  reset(): void;
}

const STORAGE_KEY = "ezbac.bankroll";

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

export function mountBankroll(host: HTMLElement): BankrollHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "bankroll";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "BANKROLL";

  const value = document.createElement("span");
  value.className = "value";

  wrapper.append(label, value);
  host.append(wrapper);

  const fromStorage = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "", 10);
  const safe = Number.isFinite(fromStorage) ? fromStorage : DEFAULT_BANKROLL;
  let bankroll = Math.max(0, safe);
  value.textContent = formatCurrency(bankroll);

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
      value.classList.remove("anim-total-tick");
      void value.offsetWidth;
      value.classList.add("anim-total-tick");
      persist(bankroll);
      return bankroll;
    },
    reset() {
      bankroll = DEFAULT_BANKROLL;
      value.textContent = formatCurrency(bankroll);
      persist(bankroll);
    },
  };
}
