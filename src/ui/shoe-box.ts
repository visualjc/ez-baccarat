export interface ShoeHandle {
  element: HTMLElement;
  discardElement: HTMLElement;
  burnReadoutElement: HTMLElement;
  originRect(): DOMRect;
  shake(): Promise<void>;
  setRemaining(remaining: number, total: number): void;
  setDiscardCount(count: number): void;
}

export function mountShoe(host: HTMLElement): ShoeHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "shoe-wrap";

  const discard = document.createElement("div");
  discard.className = "discard";
  const discardLabel = document.createElement("span");
  discardLabel.className = "discard-label";
  discardLabel.textContent = "Discard";
  const discardCount = document.createElement("span");
  discardCount.className = "discard-count";
  discardCount.textContent = "0";
  discard.append(discardLabel, discardCount);

  // The burn text now lives on the felt callout beside the burn card; this
  // element stays as the centre column of the shoe row's three-column grid.
  const burnReadout = document.createElement("div");
  burnReadout.className = "burn-readout";

  const shoe = document.createElement("div");
  shoe.className = "shoe";
  const shoeLabel = document.createElement("span");
  shoeLabel.className = "shoe-label";
  shoeLabel.textContent = "Shoe";
  const shoeMouth = document.createElement("div");
  shoeMouth.className = "shoe-mouth";
  shoe.append(shoeLabel, shoeMouth);

  wrapper.append(discard, burnReadout, shoe);
  host.append(wrapper);

  return {
    element: wrapper,
    discardElement: discard,
    burnReadoutElement: burnReadout,
    originRect() {
      return shoeMouth.getBoundingClientRect();
    },
    async shake() {
      shoe.classList.add("is-shaking");
      await new Promise<void>((resolve) => {
        let fallback: number | undefined;
        const off = () => {
          shoe.removeEventListener("animationend", off);
          if (fallback !== undefined) {
            window.clearTimeout(fallback);
          }
          shoe.classList.remove("is-shaking");
          resolve();
        };
        shoe.addEventListener("animationend", off);
        const duration = getComputedStyle(shoe).animationDuration;
        const durationMs = duration.endsWith("ms")
          ? Number.parseFloat(duration)
          : Number.parseFloat(duration) * 1000;
        // `animationend` is not guaranteed in backgrounded tabs or when a
        // browser suppresses a very short fast-forwarded animation.
        fallback = window.setTimeout(off, Math.max(1, durationMs) + 50);
      });
    },
    setRemaining(remaining, total) {
      const safeTotal = total > 0 ? total : 416;
      const pct = Math.max(0, Math.min(100, (remaining / safeTotal) * 100));
      shoe.style.setProperty("--remaining", `${pct.toFixed(2)}%`);
      shoe.setAttribute("aria-label", `${remaining} cards remaining`);
    },
    setDiscardCount(count) {
      discardCount.textContent = `${count}`;
    },
  };
}
