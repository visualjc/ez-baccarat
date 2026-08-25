import type { Card } from "../engine/card";
import { createCard, spokenCard, suitOf } from "./card-el";

export interface BurnRitualHandle {
  run(exposedCard: Card, burnCount: number): Promise<void>;
  clear(): void;
}

export interface BurnGridCell {
  index: number;
  /** Column position in cell units; a short final row lands on a half column. */
  column: number;
  row: number;
}

export interface BurnGridLayout {
  columns: number;
  rows: number;
  cells: BurnGridCell[];
}

export interface BurnDurations {
  expose: number;
  hold: number;
  place: number;
  stagger: number;
  gridHold: number;
  gather: number;
}

export interface BurnWaitSchedule {
  expose: number;
  hold: number;
  place: number;
  gridHold: number;
  gather: number;
}

/** A burn is at most ten cards, so five columns keeps every count to two rows. */
export const BURN_GRID_MAX_COLUMNS = 5;

/**
 * The card flips partway through its own expose animation — the rest of the
 * motion finishes underneath the callout hold.
 */
export const BURN_EXPOSE_FLIP_RATIO = 0.55;

/**
 * The grid shape for a burn of `count` cards: full rows first, and a short
 * final row centred under them on a half-column offset.
 */
export function burnGridLayout(count: number): BurnGridLayout {
  const total = Math.max(0, Math.floor(count));
  if (total === 0) {
    return { columns: 0, rows: 0, cells: [] };
  }

  const rows = Math.ceil(total / BURN_GRID_MAX_COLUMNS);
  const columns = Math.ceil(total / rows);
  const short = rows * columns - total;
  const cells: BurnGridCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    const isLastRow = row === rows - 1;
    const cellsInRow = isLastRow ? columns - short : columns;
    const offset = isLastRow ? short / 2 : 0;
    for (let column = 0; column < cellsInRow; column += 1) {
      cells.push({ index: cells.length, column: column + offset, row });
    }
  }

  return { columns, rows, cells };
}

/** The blocking waits of one burn ritual, in the order `run()` performs them. */
export function burnWaitSchedule(layout: BurnGridLayout, durations: BurnDurations): BurnWaitSchedule {
  const lastCell = Math.max(0, layout.cells.length - 1);
  return {
    expose: durations.expose * BURN_EXPOSE_FLIP_RATIO,
    hold: durations.hold,
    place: lastCell * durations.stagger + durations.place,
    gridHold: durations.gridHold,
    gather: durations.gather,
  };
}

/** How long the felt stays locked for a burn of this size. */
export function burnRitualBudget(layout: BurnGridLayout, durations: BurnDurations): number {
  const schedule = burnWaitSchedule(layout, durations);
  return schedule.expose + schedule.hold + schedule.place + schedule.gridHold + schedule.gather;
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

function readDurations(): BurnDurations {
  return {
    expose: parseDuration("--dur-burn-expose"),
    hold: parseDuration("--dur-burn-hold"),
    place: parseDuration("--dur-burn-place"),
    stagger: parseDuration("--dur-burn-stagger"),
    gridHold: parseDuration("--dur-burn-grid-hold"),
    gather: parseDuration("--dur-burn-gather"),
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function mountBurnRitual(
  host: HTMLElement,
  announce: (text: string) => void,
): BurnRitualHandle {
  return {
    clear() {
      host.replaceChildren();
    },
    async run(exposedCard, burnCount) {
      this.clear();

      const durations = readDurations();
      const layout = burnGridLayout(burnCount);
      const schedule = burnWaitSchedule(layout, durations);

      const scrim = document.createElement("div");
      scrim.className = "burn-scrim";
      scrim.setAttribute("aria-hidden", "true");

      const stage = document.createElement("div");
      stage.className = "burn-stage";

      const slot = document.createElement("div");
      slot.className = "burn-card-slot";

      const cardHandle = createCard(exposedCard);
      cardHandle.element.classList.add("burn-card");
      slot.append(cardHandle.element);
      stage.append(slot);
      host.append(scrim, stage);

      cardHandle.element.classList.add("from-shoe");
      await wait(schedule.expose);
      cardHandle.flip();
      cardHandle.element.classList.add("focused");

      const cardWord = burnCount === 1 ? "card" : "cards";
      const text = `BURN CARD · ${exposedCard.rank}${suitOf(exposedCard)} · burning ${burnCount} ${cardWord}`;
      // The face and the callout are both aria-hidden, so the live region
      // carries the suit in words rather than as a glyph.
      const spoken = `Burn card ${spokenCard(exposedCard)}, burning ${burnCount} ${cardWord}.`;
      const callout = document.createElement("p");
      callout.className = "burn-callout";
      // `announce` already routes this to the aria-live status region.
      callout.setAttribute("aria-hidden", "true");
      callout.textContent = text;
      stage.append(callout);
      announce(spoken);

      await wait(schedule.hold);

      const grid = document.createElement("div");
      grid.className = "burn-grid";
      grid.setAttribute("aria-hidden", "true");
      grid.style.setProperty("--burn-cols", `${layout.columns}`);
      grid.style.setProperty("--burn-rows", `${layout.rows}`);
      grid.style.setProperty("--burn-count", `${layout.cells.length}`);

      for (const cell of layout.cells) {
        const back = document.createElement("span");
        back.className = "burn-grid-card";
        back.style.setProperty("--burn-cell", `${cell.index}`);
        back.style.setProperty("--burn-col", `${cell.column}`);
        back.style.setProperty("--burn-row", `${cell.row}`);
        back.style.setProperty("--burn-tilt", cell.index % 2 === 0 ? "6deg" : "-5deg");
        grid.append(back);
      }

      stage.append(grid);

      await wait(schedule.place);
      await wait(schedule.gridHold);

      stage.classList.add("is-gathering");
      scrim.classList.add("is-gathering");

      await wait(schedule.gather);
      this.clear();
    },
  };
}
