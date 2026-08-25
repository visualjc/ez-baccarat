import { expect, test } from "bun:test";

const css = await Bun.file(new URL("../styles/app.css", import.meta.url)).text();
const tokens = await Bun.file(new URL("../styles/tokens.css", import.meta.url)).text();

/** The declaration block of one top-level rule, addressed by its exact selector. */
function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing rule: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

/** The layers that must cover the felt exactly, each bound to its own selector. */
const FELT_LAYERS = ["#table-view::before", "#table-view::after", ".burn-scrim"];

test("every felt layer insets by the rail width alone, never by the gutter", () => {
  for (const selector of FELT_LAYERS) {
    const body = ruleBody(selector);
    expect(body).toMatch(/inset:\s*var\(--rail-w\);/);
    expect(body).toMatch(/border-radius:\s*var\(--felt-radius\);/);
  }
  expect(css).not.toMatch(/inset:\s*22px/);
  expect(css).not.toMatch(/calc\(var\(--rail-radius\) - 10px\)/);
});

test("the gutter reaches the table's padding and nothing else", () => {
  expect(ruleBody("#table-view")).toMatch(
    /padding:\s*calc\(var\(--rail-w\) \+ var\(--felt-gutter\)\);/,
  );

  // A second consumer of the gutter is the regression this file exists to
  // catch: any felt layer that grows by it draws a bright ring inside the rim.
  const uses = [...css.matchAll(/var\(--felt-gutter\)/g)];
  expect(uses).toHaveLength(1);
});

test("the gutter tightens at each breakpoint the table has to survive", () => {
  const base = tokens.match(/--felt-gutter:\s*(\d+)px/);
  expect(base).not.toBeNull();

  // Declarations, not var() uses — these re-token the gutter per breakpoint.
  const overrides = [1239, 859].map((width) => {
    const match = css.match(
      new RegExp(`max-width:\\s*${width}px\\)\\s*\\{\\s*:root\\s*\\{[^}]*--felt-gutter:\\s*(\\d+)px`),
    );
    expect(match).not.toBeNull();
    return Number(match![1]);
  });

  // Horizontal gutter is felt the tray cannot spend, so it shrinks as the
  // window does rather than squeezing the controls.
  const [wide, mid, tight] = [Number(base![1]), ...overrides];
  expect(wide).toBeGreaterThan(mid!);
  expect(mid!).toBeGreaterThan(tight!);
  expect(tight!).toBeGreaterThan(0);
});
