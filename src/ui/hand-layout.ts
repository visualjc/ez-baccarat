/**
 * The hand row's geometry, as arithmetic rather than as three numbers spread
 * across a stylesheet.
 *
 * `#row-hands` is `minmax(0, 1fr) <divider> minmax(0, 1fr)` with one gap
 * between each pair of tracks, and the centre line is painted down the middle
 * of the divider track. Each seat's two-card group is seated against that
 * line — the player's by right-aligning its half, the banker's by the column
 * order it already has — so the number that matters is the STAND-OFF: how far
 * a group's inner edge sits from the line.
 *
 * These values are the CSS's source of truth. `hand-layout.test.ts` asserts
 * that `tokens.css` still declares them, so the arithmetic here and the
 * stylesheet cannot drift apart silently.
 */
export const HAND_ROW_TRACKS = {
  /** `--hand-divider-w`: the centre column the divider line is painted in. */
  dividerWidth: 132,
  /** `--hand-row-gap`: the gap between every pair of tracks in the row. */
  gap: 24,
} as const;

export interface HandRowTracks {
  /** The row's content width — everything inside the felt's padding. */
  rowWidth: number;
  /** The divider column's width. */
  dividerWidth: number;
  /** The gap between each pair of tracks. */
  gap: number;
  /**
   * The two flanking track widths, player first. Omit for the symmetric
   * `1fr | divider | 1fr` case the stylesheet actually declares; pass it
   * explicitly to model a row whose flanks are NOT equal.
   */
  flanks?: readonly [number, number];
}

export interface HandRowGeometry {
  /** Distance from the row's left edge to the painted centre line. */
  centreLine: number;
  /** The player group's inner (right) edge. */
  playerInnerEdge: number;
  /** The banker group's inner (left) edge. */
  bankerInnerEdge: number;
  /** How far the player's inner edge stands off the centre line. */
  playerStandoff: number;
  /** How far the banker's inner edge stands off the centre line. */
  bankerStandoff: number;
  /** The banker group's outer (right) edge — the row's right edge when the tracks add up. */
  bankerOuterEdge: number;
}

/** Where each seat's inner edge lands, given the row's track sizes. */
export function handRowGeometry(tracks: HandRowTracks): HandRowGeometry {
  const { rowWidth, dividerWidth, gap } = tracks;
  const free = rowWidth - dividerWidth - gap * 2;
  const [playerFlank, bankerFlank] = tracks.flanks ?? [free / 2, free / 2];

  const playerInnerEdge = playerFlank;
  const dividerStart = playerFlank + gap;
  const centreLine = dividerStart + dividerWidth / 2;
  const bankerInnerEdge = dividerStart + dividerWidth + gap;

  return {
    centreLine,
    playerInnerEdge,
    bankerInnerEdge,
    playerStandoff: centreLine - playerInnerEdge,
    bankerStandoff: bankerInnerEdge - centreLine,
    bankerOuterEdge: bankerInnerEdge + bankerFlank,
  };
}
