import { expect, test } from "bun:test";

import {
  BURN_GRID_MAX_COLUMNS,
  burnGridLayout,
  burnRitualBudget,
  burnWaitSchedule,
  type BurnDurations,
} from "./burn-ritual";

const SHAPES: Record<number, { columns: number; rows: number }> = {
  1: { columns: 1, rows: 1 },
  2: { columns: 2, rows: 1 },
  3: { columns: 3, rows: 1 },
  4: { columns: 4, rows: 1 },
  5: { columns: 5, rows: 1 },
  6: { columns: 3, rows: 2 },
  7: { columns: 4, rows: 2 },
  8: { columns: 4, rows: 2 },
  9: { columns: 5, rows: 2 },
  10: { columns: 5, rows: 2 },
};

test("every burn count from one to ten lays out as a full or centred-short grid", () => {
  for (const [rawCount, shape] of Object.entries(SHAPES)) {
    const count = Number(rawCount);
    const layout = burnGridLayout(count);

    expect(layout.columns).toBe(shape.columns);
    expect(layout.rows).toBe(shape.rows);
    expect(layout.columns).toBeLessThanOrEqual(BURN_GRID_MAX_COLUMNS);
    expect(layout.cells).toHaveLength(count);

    layout.cells.forEach((cell, index) => {
      expect(cell.index).toBe(index);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(layout.rows);
      expect(cell.column).toBeGreaterThanOrEqual(0);
      // A half-column offset still has to leave the last card inside the box.
      expect(cell.column).toBeLessThanOrEqual(layout.columns - 1);
    });

    // Rows fill top to bottom, in order.
    const rowsSeen = layout.cells.map((cell) => cell.row);
    expect([...rowsSeen].sort((a, b) => a - b)).toEqual(rowsSeen);
  }
});

test("a short final row is centred on a half column instead of flushing left", () => {
  for (const count of [7, 9]) {
    const layout = burnGridLayout(count);
    const lastRow = layout.cells.filter((cell) => cell.row === layout.rows - 1);
    const fullRow = layout.cells.filter((cell) => cell.row === 0);

    expect(lastRow.length).toBe(fullRow.length - 1);
    expect(lastRow[0]!.column).toBe(0.5);

    const rowCentre = (cells: typeof layout.cells) =>
      (cells[0]!.column + cells.at(-1)!.column) / 2;
    expect(rowCentre(lastRow)).toBeCloseTo(rowCentre(fullRow), 10);
  }
});

test("full rows and the degenerate empty burn stay well formed", () => {
  for (const count of [6, 8, 10]) {
    const layout = burnGridLayout(count);
    expect(layout.cells.every((cell) => Number.isInteger(cell.column))).toBe(true);
    expect(layout.cells).toHaveLength(layout.columns * layout.rows);
  }

  expect(burnGridLayout(0)).toEqual({ columns: 0, rows: 0, cells: [] });
  expect(burnGridLayout(-3).cells).toHaveLength(0);
});

test("the felt stays locked for the burn no longer than the CSS token budget allows", async () => {
  const css = await Bun.file(new URL("../styles/anim.css", import.meta.url)).text();
  const duration = (name: string) => {
    const match = css.match(new RegExp(`${name}:\\s*(\\d+)ms`));
    if (!match) throw new Error(`missing ${name}`);
    return Number(match[1]);
  };

  const durations: BurnDurations = {
    expose: duration("--dur-burn-expose"),
    hold: duration("--dur-burn-hold"),
    place: duration("--dur-burn-place"),
    stagger: duration("--dur-burn-stagger"),
    gridHold: duration("--dur-burn-grid-hold"),
    gather: duration("--dur-burn-gather"),
  };

  const widest = burnGridLayout(10);
  const schedule = burnWaitSchedule(widest, durations);

  // The stagger is CSS-driven, so the wait has to outlast the last card's delay.
  expect(schedule.place).toBe(9 * durations.stagger + durations.place);
  expect(burnRitualBudget(widest, durations)).toBeLessThanOrEqual(3000);
  // A one-card burn pays for no stagger it does not use.
  expect(burnWaitSchedule(burnGridLayout(1), durations).place).toBe(durations.place);
});
