import { CHIP_DENOMS } from "./types";

export interface ChipTrayHandle {
  element: HTMLElement;
  selected: () => number;
  select: (value: number) => void;
  originRect: () => DOMRect;
  setLocked: (locked: boolean) => void;
}

const STORAGE_KEY = "ezbac.chip";

export function mountChipTray(host: HTMLElement): ChipTrayHandle {
  const tray = document.createElement("div");
  tray.className = "chip-tray";
  tray.setAttribute("role", "radiogroup");
  tray.setAttribute("aria-label", "Chip values");

  const chips: HTMLButtonElement[] = [];
  let selectedValue: typeof CHIP_DENOMS[number] = CHIP_DENOMS[0];

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  const numeric = persisted ? Number.parseInt(persisted, 10) : Number.NaN;
  if (!Number.isNaN(numeric) && CHIP_DENOMS.includes(numeric as typeof CHIP_DENOMS[number])) {
    selectedValue = numeric as typeof CHIP_DENOMS[number];
  }

  for (const value of CHIP_DENOMS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip chip-value-${value}`;
    chip.dataset.value = `${value}`;
    chip.setAttribute("role", "radio");
    chip.setAttribute("aria-label", `${value} chip`);
    chip.textContent = `${value}`;
    chip.addEventListener("click", () => {
      select(value);
    });
    tray.append(chip);
    chips.push(chip);
  }

  const render = () => {
    chips.forEach((chip) => {
      const value = Number.parseInt(chip.dataset.value ?? "", 10);
      const active = value === selectedValue;
      chip.classList.toggle("is-selected", active);
      chip.setAttribute("aria-checked", String(active));
    });
  };

  const select = (value: number) => {
    if (!CHIP_DENOMS.includes(value as typeof CHIP_DENOMS[number])) {
      return;
    }
    selectedValue = value as typeof CHIP_DENOMS[number];
    render();
    try {
      window.localStorage.setItem(STORAGE_KEY, `${value}`);
    } catch {
      // ignore persistent storage issues in privacy mode / restricted envs
    }
  };

  render();
  host.append(tray);

  return {
    element: tray,
    selected: () => selectedValue,
    select,
    originRect: () => {
      const selected = chips.find((chip) => chip.dataset.value === `${selectedValue}`) ?? chips[0];
      return selected.getBoundingClientRect();
    },
    setLocked(locked) {
      chips.forEach((chip) => {
        chip.disabled = locked;
      });
    },
  };
}
