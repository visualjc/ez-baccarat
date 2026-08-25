export interface ControlsHandle {
  element: HTMLElement;
  clearButton: HTMLButtonElement;
  rebetButton: HTMLButtonElement;
  dealButton: HTMLButtonElement;
  setDealEnabled(enabled: boolean): void;
  setBusy(busy: boolean): void;
}

export function mountControls(host: HTMLElement): ControlsHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "actions";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "btn btn-ghost";
  clearButton.textContent = "Clear";

  const rebetButton = document.createElement("button");
  rebetButton.type = "button";
  rebetButton.className = "btn btn-ghost";
  rebetButton.textContent = "Rebet";

  const dealButton = document.createElement("button");
  dealButton.type = "button";
  dealButton.className = "btn btn-primary";
  dealButton.textContent = "DEAL";

  wrapper.append(clearButton, rebetButton, dealButton);
  host.append(wrapper);

  let dealEnabled = false;
  let busy = false;

  const sync = () => {
    clearButton.disabled = busy;
    rebetButton.disabled = busy;
    dealButton.disabled = busy ? false : !dealEnabled;
    dealButton.textContent = busy ? "FAST" : "DEAL";
  };

  sync();

  return {
    element: wrapper,
    clearButton,
    rebetButton,
    dealButton,
    setDealEnabled(enabled) {
      dealEnabled = enabled;
      sync();
    },
    setBusy(nextBusy) {
      busy = Boolean(nextBusy);
      sync();
    },
  };
}
