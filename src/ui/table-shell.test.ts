import { expect, test } from "bun:test";

const css = await Bun.file(new URL("../styles/app.css", import.meta.url)).text();

test("the felt, its noise overlay and the burn scrim all inset by the rail width alone", () => {
  // The three layers that must cover the felt exactly. If one of them ever
  // picks up --felt-gutter along with #table-view's padding, it draws a bright
  // ring inside the gold rim instead of sitting flush against it.
  expect([...css.matchAll(/inset:\s*var\(--rail-w\)/g)]).toHaveLength(3);
  expect(css).not.toMatch(/inset:\s*var\(--rail-w\)\s*\+/);
  expect(css).not.toMatch(/inset:\s*22px/);
});

test("only the table's own padding carries the gutter that keeps UI off the rim", () => {
  expect(css).toMatch(/padding:\s*calc\(var\(--rail-w\) \+ var\(--felt-gutter\)\)/);
  expect([...css.matchAll(/var\(--felt-gutter\)/g)].length).toBeGreaterThanOrEqual(1);
});

test("the felt radius is a token, not three copies of the same arithmetic", () => {
  expect(css).not.toMatch(/calc\(var\(--rail-radius\) - 10px\)/);
  expect([...css.matchAll(/border-radius:\s*var\(--felt-radius\)/g)]).toHaveLength(3);
});

test("the gutter tightens at each breakpoint the table has to survive", async () => {
  const tokens = await Bun.file(new URL("../styles/tokens.css", import.meta.url)).text();
  const base = tokens.match(/--felt-gutter:\s*(\d+)px/);
  expect(base).not.toBeNull();

  const narrow = css.match(/max-width:\s*1239px\)\s*\{\s*:root\s*\{[^}]*--felt-gutter:\s*(\d+)px/);
  const narrowest = css.match(/max-width:\s*859px\)\s*\{\s*:root\s*\{[^}]*--felt-gutter:\s*(\d+)px/);
  expect(narrow).not.toBeNull();
  expect(narrowest).not.toBeNull();

  // Horizontal gutter is felt the tray cannot spend, so it shrinks as the
  // window does rather than squeezing the controls.
  const [wide, mid, tight] = [base![1]!, narrow![1]!, narrowest![1]!].map(Number);
  expect(wide).toBeGreaterThan(mid);
  expect(mid).toBeGreaterThan(tight);
  expect(tight).toBeGreaterThan(0);
});
