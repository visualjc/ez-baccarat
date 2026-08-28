import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { mountBankroll } from "./bankroll";
import { mountKeyboard, type KeyboardHandlers } from "./keyboard";

class FakeElement {
  className = "";
  textContent = "";
  hidden = false;
  disabled = false;
  offsetWidth = 0;
  readonly children: FakeElement[] = [];
  readonly classList = { add() {}, remove() {} };
  readonly listeners = new Map<string, Array<(event: Event) => void>>();

  constructor(readonly tagName = "DIV") {}

  append(...children: FakeElement[]) {
    this.children.push(...children);
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type: string, event = {} as Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

const findButton = (root: FakeElement) => {
  const button = root.children.flatMap((child) => [child, ...child.children])
    .find((child) => child.tagName === "BUTTON");
  if (!button) throw new Error("expected bankroll action button");
  return button;
};

let oldWindow: PropertyDescriptor | undefined;
let oldDocument: PropertyDescriptor | undefined;
let oldRaf: PropertyDescriptor | undefined;
let stored: Map<string, string>;
let writes: Array<[string, string]>;
let documentListeners: Map<string, Array<(event: KeyboardEvent) => void>>;

beforeEach(() => {
  oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  oldRaf = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
  stored = new Map([["ezbac.bankroll", "1"]]);
  writes = [];
  documentListeners = new Map();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => {
          writes.push([key, value]);
          stored.set(key, value);
        },
      },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: (tag: string) => new FakeElement(tag.toUpperCase()),
      addEventListener(type: string, listener: (event: KeyboardEvent) => void) {
        const listeners = documentListeners.get(type) ?? [];
        listeners.push(listener);
        documentListeners.set(type, listeners);
      },
      removeEventListener(type: string, listener: (event: KeyboardEvent) => void) {
        documentListeners.set(type, (documentListeners.get(type) ?? []).filter((item) => item !== listener));
      },
    },
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(performance.now() + 300);
      return 1;
    },
  });
});

afterEach(() => {
  if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
  else delete (globalThis as { window?: unknown }).window;
  if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
  else delete (globalThis as { document?: unknown }).document;
  if (oldRaf) Object.defineProperty(globalThis, "requestAnimationFrame", oldRaf);
  else delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
});

describe("bankroll play-chip reload", () => {
  test("settling to exact zero persists zero and reveals a player action without auto-granting", () => {
    const host = new FakeElement();
    const bankroll = mountBankroll(host as unknown as HTMLElement);

    expect(bankroll.get()).toBe(1);
    expect(bankroll.apply(-1)).toBe(0);

    const button = findButton(host);
    expect(button.textContent).toBe("Add $1,000 play chips");
    expect(button.hidden).toBe(false);
    expect(button.disabled).toBe(false);
    expect(bankroll.get()).toBe(0);
    expect(writes).toEqual([["ezbac.bankroll", "0"]]);
  });

  test("an unlocked request at zero sets and persists exactly $1,000 then hides the action", () => {
    stored.set("ezbac.bankroll", "0");
    const host = new FakeElement();
    const bankroll = mountBankroll(host as unknown as HTMLElement);

    expect(bankroll.requestReload()).toBe(true);

    expect(bankroll.get()).toBe(1000);
    expect(findButton(host).hidden).toBe(true);
    expect(writes).toEqual([["ezbac.bankroll", "1000"]]);
  });

  test("positive and repeated requests are no-ops without storage writes", () => {
    const positiveHost = new FakeElement();
    const positive = mountBankroll(positiveHost as unknown as HTMLElement);
    expect(positive.requestReload()).toBe(false);
    expect(positive.get()).toBe(1);
    expect(writes).toEqual([]);

    stored.set("ezbac.bankroll", "0");
    const zeroHost = new FakeElement();
    const reloaded = mountBankroll(zeroHost as unknown as HTMLElement);
    expect(reloaded.requestReload()).toBe(true);
    writes.length = 0;

    expect(reloaded.requestReload()).toBe(false);
    expect(reloaded.get()).toBe(1000);
    expect(writes).toEqual([]);
  });

  test("locked zero refuses reload and unlocking reveals the action", () => {
    stored.set("ezbac.bankroll", "0");
    const host = new FakeElement();
    const bankroll = mountBankroll(host as unknown as HTMLElement);
    const button = findButton(host);

    bankroll.setReloadLocked(true);
    expect(button.hidden).toBe(true);
    expect(button.disabled).toBe(true);
    expect(bankroll.requestReload()).toBe(false);
    expect(bankroll.get()).toBe(0);
    expect(writes).toEqual([]);

    bankroll.setReloadLocked(false);
    expect(button.hidden).toBe(false);
    expect(button.disabled).toBe(false);
  });

  test("the native action delegates one player request through the bankroll interface", () => {
    stored.set("ezbac.bankroll", "0");
    const host = new FakeElement();
    let requestCount = 0;
    let bankroll!: ReturnType<typeof mountBankroll>;
    bankroll = mountBankroll(host as unknown as HTMLElement, {
      onReloadRequested: () => {
        requestCount += 1;
        bankroll.requestReload();
      },
    });

    findButton(host).dispatch("click");

    expect(requestCount).toBe(1);
    expect(bankroll.get()).toBe(1000);
    expect(writes).toEqual([["ezbac.bankroll", "1000"]]);
  });

  test("Enter and Space on the focused action grant once without global Deal or Fast", () => {
    for (const key of ["Enter", " "]) {
      stored.set("ezbac.bankroll", "0");
      writes.length = 0;
      let requestCount = 0;
      let dealCount = 0;
      const host = new FakeElement();
      let bankroll!: ReturnType<typeof mountBankroll>;
      bankroll = mountBankroll(host as unknown as HTMLElement, {
        onReloadRequested: () => {
          requestCount += 1;
          bankroll.requestReload();
        },
      });
      const noop = () => {};
      const keyboard = mountKeyboard({
        bet: noop,
        selectChip: noop,
        deal: () => { dealCount += 1; },
        fastForward: noop,
        clear: noop,
        rebet: noop,
        double: noop,
        newShoe: noop,
        removeLast: noop,
        toggleMode: noop,
        dismiss: noop,
        help: noop,
      } satisfies KeyboardHandlers);
      const button = findButton(host);
      let stopped = false;
      let prevented = false;
      const event = {
        key,
        target: button,
        isComposing: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        stopPropagation: () => { stopped = true; },
        preventDefault: () => { prevented = true; },
      } as unknown as KeyboardEvent;

      button.dispatch("keydown", event);
      if (!stopped) {
        for (const listener of documentListeners.get("keydown") ?? []) listener(event);
      }
      if (!prevented) button.dispatch("click");

      expect(requestCount).toBe(1);
      expect(dealCount).toBe(0);
      expect(bankroll.get()).toBe(1000);
      expect(writes).toEqual([["ezbac.bankroll", "1000"]]);
      keyboard.detach();
    }
  });

  test("a storage write failure is nonfatal when reloading zero", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => key === "ezbac.bankroll" ? "0" : null,
        setItem: () => { throw new DOMException("Blocked", "SecurityError"); },
      },
    });
    const bankroll = mountBankroll(new FakeElement() as unknown as HTMLElement);

    expect(bankroll.requestReload()).toBe(true);
    expect(bankroll.get()).toBe(1000);
  });
});
