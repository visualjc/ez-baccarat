import type { Settlement } from "../engine/rules";
import { formatNet } from "./types";

export interface OutcomeBannerHandle {
  element: HTMLElement;
  show(settlement: Settlement, net: number): Promise<void>;
  hide(): void;
  fastForward(): void;
  resetPlayback(): void;
  isVisible(): boolean;
}

function parseDuration(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value.endsWith("ms")) {
    return Number.parseFloat(value);
  }
  if (value.endsWith("s")) {
    return Number.parseFloat(value) * 1000;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function titleFor(settlement: Settlement): string {
  if (settlement.isDragon) {
    return "DRAGON!";
  }
  if (settlement.isPanda) {
    return "PANDA!";
  }
  if (settlement.outcome === "player") {
    return "PLAYER";
  }
  if (settlement.outcome === "banker") {
    return "BANKER";
  }
  return "TIE";
}

function themeFor(settlement: Settlement): string {
  if (settlement.isDragon) {
    return "dragon";
  }
  if (settlement.isPanda) {
    return "panda";
  }
  return settlement.outcome;
}

export function mountOutcomeBanner(host: HTMLElement): OutcomeBannerHandle {
  const banner = document.createElement("div");
  banner.id = "outcome-banner";
  banner.setAttribute("role", "status");

  const title = document.createElement("h2");
  title.className = "banner-title";

  const line = document.createElement("p");
  line.className = "banner-subtitle";

  banner.append(title, line);
  host.append(banner);

  let autoHideTimer: number | undefined;
  let activeTimer: number | undefined;
  let activeResolve: (() => void) | undefined;
  let fastForwarded = false;

  const wait = (ms: number) => new Promise<void>((resolve) => {
    if (fastForwarded) {
      resolve();
      return;
    }
    activeResolve = resolve;
    activeTimer = window.setTimeout(() => {
      activeTimer = undefined;
      activeResolve = undefined;
      resolve();
    }, ms);
  });

  return {
    element: banner,
    async show(settlement, net) {
      if (autoHideTimer !== undefined) {
        window.clearTimeout(autoHideTimer);
      }

      const theme = themeFor(settlement);
      banner.dataset.state = theme;
      title.className = `banner-title ${theme}`;
      title.textContent = titleFor(settlement);
      line.textContent = `Player ${settlement.playerTotal} · Banker ${settlement.bankerTotal} · ${formatNet(net)}`;
      banner.classList.remove("is-hiding");
      banner.classList.add("is-visible");

      autoHideTimer = window.setTimeout(() => {
        this.hide();
      }, 2600);

      await wait(parseDuration("--dur-banner-in"));
    },
    hide() {
      if (!banner.classList.contains("is-visible")) {
        return;
      }
      banner.classList.add("is-hiding");
      window.setTimeout(() => {
        banner.classList.remove("is-visible", "is-hiding");
        banner.dataset.state = "";
      }, parseDuration("--dur-banner-out"));
    },
    fastForward() {
      fastForwarded = true;
      if (activeTimer !== undefined) {
        window.clearTimeout(activeTimer);
        activeTimer = undefined;
      }
      const resolve = activeResolve;
      activeResolve = undefined;
      resolve?.();
    },
    resetPlayback() {
      fastForwarded = false;
    },
    isVisible() {
      return banner.classList.contains("is-visible");
    },
  };
}
