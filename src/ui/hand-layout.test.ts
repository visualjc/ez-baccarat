import { expect, test } from "bun:test";

import { HAND_ROW_TRACKS, handRowGeometry } from "./hand-layout";

const css = await Bun.file(new URL("../styles/app.css", import.meta.url)).text();
const anim = await Bun.file(new URL("../styles/anim.css", import.meta.url)).text();
const tokens = await Bun.file(new URL("../styles/tokens.css", import.meta.url)).text();

/** The body of one @media block, braces balanced past the rules inside it. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query} {`);
  if (start === -1) throw new Error(`missing media block: ${query}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated media block: ${query}`);
}

/** The declaration block of one top-level rule, addressed by its exact selector. */
function ruleBody(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing rule: ${selector}`);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

/** The body of one @keyframes block, braces balanced across its stops. */
function keyframesBody(name: string): string {
  const start = anim.indexOf(`@keyframes ${name} {`);
  if (start === -1) throw new Error(`missing keyframes: ${name}`);
  const open = anim.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < anim.length; i += 1) {
    if (anim[i] === "{") depth += 1;
    if (anim[i] === "}") {
      depth -= 1;
      if (depth === 0) return anim.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated keyframes: ${name}`);
}

/**
 * The COMPLETE grid-template-areas declaration for one hand, header row first.
 * Asserting only the header row leaves the cards and rule areas undefined —
 * they fall back to implicit placement and stop spanning the row.
 */
function expectHandAreas(body: string, headerRow: string): void {
  expect(body).toMatch(
    new RegExp(
      `grid-template-areas:\\s*"${headerRow}"\\s*"cards cards cards"\\s*"rule\\s+rule\\s+rule";`,
    ),
  );
}

const { dividerWidth, gap } = HAND_ROW_TRACKS;

test("both seats stand the same distance off the centre line, at every width", () => {
  for (const rowWidth of [1440, 1180, 900]) {
    const row = handRowGeometry({ rowWidth, dividerWidth, gap });
    expect(row.playerStandoff).toBe(row.bankerStandoff);
    // Recomputed from the tracks, never asserted as a literal: the standoff is
    // the gap plus half the divider, which is what makes the two halves mirror.
    expect(row.playerStandoff).toBe(gap + dividerWidth / 2);
    expect(row.bankerOuterEdge).toBe(rowWidth);
  }
});

test("the standoff survives asymmetric flanks — only the CSS can break the mirror", () => {
  // This is the honest limit of the arithmetic. Widen one flank and the two
  // inner EDGES move apart, but each still stands the same distance off the
  // line, so no amount of computation here proves the halves are symmetric.
  // That claim lives entirely in the track topology, guarded below.
  const lopsided = handRowGeometry({ rowWidth: 1440, dividerWidth, gap, flanks: [500, 784] });
  expect(lopsided.playerStandoff).toBe(lopsided.bankerStandoff);
  expect(lopsided.playerInnerEdge).not.toBe(1440 - lopsided.bankerInnerEdge);
});

test("the hand row declares the symmetric tracks the arithmetic assumes", () => {
  const body = ruleBody(css, "#row-hands");
  expect(body).toMatch(
    /grid-template-columns:\s*minmax\(0, 1fr\) var\(--hand-divider-w\) minmax\(0, 1fr\);/,
  );
  expect(body).toMatch(/gap:\s*var\(--hand-row-gap\);/);
  expect(tokens).toMatch(new RegExp(`--hand-divider-w:\\s*${dividerWidth}px;`));
  expect(tokens).toMatch(new RegExp(`--hand-row-gap:\\s*${gap}px;`));
});

test("the player half is seated inboard and its card row runs outward", () => {
  const seat = ruleBody(css, '.hand[data-seat="player"]');
  // The pad track is what pushes the header pair against the divider; without
  // it the label and total fall back to the felt's left rim.
  expect(seat).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) auto auto;/);
  expectHandAreas(seat, "pad\\s+label total");

  expect(ruleBody(css, '.hand[data-seat="player"] .hand-cards')).toMatch(
    /flex-direction:\s*row-reverse;/,
  );
  // The third-card narration follows the half it belongs to; left alone it
  // reads from the felt's rim while everything above it sits by the divider.
  expect(ruleBody(css, '.hand[data-seat="player"] .hand-rule')).toMatch(
    /text-align:\s*right;/,
  );
});

test("the banker half puts its total inboard too, so the two pills flank the divider", () => {
  const seat = ruleBody(css, '.hand[data-seat="banker"]');
  expect(seat).toMatch(/grid-template-columns:\s*auto auto minmax\(0, 1fr\);/);
  expectHandAreas(seat, "total label pad");
});

test("the sideways card is displaced inboard, not given reserved width", () => {
  // Reserving the overhang costs the lane its whole budget and flex-shrinks
  // every card in the hand the moment a third card lands. Displacing it — a
  // positive outboard margin against a negative inboard one — nets to zero
  // layout width and keeps the painted card off the wood rail.
  expect(ruleBody(css, ".card.is-third")).toMatch(
    /--third-overhang:\s*calc\(\(var\(--card-h\) - var\(--card-w\)\) \/ 2\);/,
  );
  expect(ruleBody(css, ".card.is-third")).not.toMatch(/margin-inline:/);

  // Outboard is the side away from the divider, so the pair is mirrored per seat.
  const banker = ruleBody(css, '.hand[data-seat="banker"] .card.is-third');
  expect(banker).toMatch(/margin-inline-start:\s*calc\(-1 \* var\(--third-overhang\)\);/);
  expect(banker).toMatch(/margin-inline-end:\s*var\(--third-overhang\);/);

  const player = ruleBody(css, '.hand[data-seat="player"] .card.is-third');
  expect(player).toMatch(/margin-inline-start:\s*var\(--third-overhang\);/);
  expect(player).toMatch(/margin-inline-end:\s*calc\(-1 \* var\(--third-overhang\)\);/);

  expect(ruleBody(css, ".hand-cards")).toMatch(/gap:\s*var\(--hand-card-gap\);/);
  expect(tokens).toMatch(/--hand-card-gap:\s*12px;/);
});

test("each seat's third-card rotation is a variable the emphasis pulse reads back", () => {
  // deal-slide animates transform on the same card, so every emphasis stop has
  // to re-state the rotation. Writing the angle out at a stop is the exact
  // regression this catches: a mirrored seat would keep the banker's angle for
  // the whole pulse, and only one of the three stops would look wrong.
  expect(ruleBody(css, ".card.is-third")).toMatch(
    /--third-transform:\s*rotate\(90deg\) translate\(6px, -4px\);/,
  );
  // Writing the angle here instead of reading the variable would silently
  // un-mirror the player: the seat override sets the variable, not transform.
  expect(ruleBody(css, ".card.is-third")).toMatch(
    /transform:\s*var\(--third-transform\);/,
  );
  expect(ruleBody(css, '.hand[data-seat="player"] .card.is-third')).toMatch(
    /--third-transform:\s*rotate\(-90deg\) translate\(-6px, -4px\);/,
  );

  const stops = keyframesBody("third-card-emphasis")
    .split(";")
    .filter((declaration) => declaration.includes("transform:"));
  expect(stops).toHaveLength(3);
  for (const stop of stops) {
    expect(stop).toMatch(/transform:\s*var\(--third-transform\)/);
  }
  expect(keyframesBody("third-card-emphasis")).not.toMatch(/rotate\(/);
});

test("the stacked breakpoint gives up seating rather than seating against nothing", () => {
  // Below 860px #row-hands collapses to one column and .hand-divider is hidden.
  // Left alone, the player rule would throw its half to the row's RIGHT rim and
  // the banker's to its LEFT — the exact inverse of the layout they exist for.
  const stacked = mediaBlock("(max-width: 859px)");
  expect(ruleBody(stacked, "#row-hands")).toMatch(/grid-template-columns:\s*1fr;/);
  expect(ruleBody(stacked, ".hand-divider")).toMatch(/display:\s*none;/);

  const both = ruleBody(stacked, '.hand[data-seat="player"], .hand[data-seat="banker"]');
  expectHandAreas(both, "label total pad");
  // The tracks matter as much as the areas: leave the player's wide
  // minmax(0, 1fr) auto auto in place and the header still hugs the right rim
  // no matter which areas are named over it.
  expect(both).toMatch(/grid-template-columns:\s*auto auto minmax\(0, 1fr\);/);

  expect(ruleBody(stacked, '.hand[data-seat="player"] .hand-cards')).toMatch(
    /flex-direction:\s*row;/,
  );
  expect(ruleBody(stacked, '.hand[data-seat="player"] .hand-rule')).toMatch(
    /text-align:\s*left;/,
  );

  // Dealt forward again, the player's third card is the rightmost item, so it
  // takes the banker's rotation and the banker's displacement.
  const third = ruleBody(stacked, '.hand[data-seat="player"] .card.is-third');
  expect(third).toMatch(/--third-transform:\s*rotate\(90deg\) translate\(6px, -4px\);/);
  expect(third).toMatch(/margin-inline-start:\s*calc\(-1 \* var\(--third-overhang\)\);/);
  expect(third).toMatch(/margin-inline-end:\s*var\(--third-overhang\);/);
});
