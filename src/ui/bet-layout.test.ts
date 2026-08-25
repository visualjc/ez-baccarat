import { expect, test } from "bun:test";

import { mountBetLayout } from "./bet-layout";
import { canPlaceChip } from "./state";

class FakeElement {
  className = "";
  dataset: Record<string, string> = {};
  style = { setProperty() {} };
  classList = { add() {}, remove() {}, toggle() {} };
  tabIndex = 0;
  textContent = "";
  type = "";

  append(..._children: FakeElement[]) {}
  replaceChildren(..._children: FakeElement[]) {}
  setAttribute(_name: string, _value: string) {}
  addEventListener(_type: string, _listener: EventListener) {}
  focus() {}
}

test("bankroll guard refuses scripted pointer and keyboard placement without mutating wagers", () => {
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => new FakeElement() },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { setTimeout: () => 1 },
  });

  try {
    const denied: string[] = [];
    const layout = mountBetLayout(new FakeElement() as unknown as HTMLElement, {
      onInvalidBet: (kind) => denied.push(kind),
    });
    layout.setCanPlace((amount) => canPlaceChip(100, layout.snapshot(), amount));

    expect(layout.place("player", 100)).toBe(true);
    const beforeKeyboardDenial = layout.snapshot();
    expect(layout.place("banker", 1)).toBe(false);
    expect(layout.snapshot()).toEqual(beforeKeyboardDenial);

    layout.clearAll();
    expect(layout.place("player", 75)).toBe(true);
    expect(layout.place("banker", 25)).toBe(true);
    const beforePointerDenial = layout.snapshot();
    expect(layout.place("dragon", 1)).toBe(false);
    expect(layout.snapshot()).toEqual(beforePointerDenial);
    expect(denied).toEqual(["banker", "dragon"]);
  } finally {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete (globalThis as { document?: unknown }).document;
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete (globalThis as { window?: unknown }).window;
  }
});
