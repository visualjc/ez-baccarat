import { RANKS, type Card } from "../engine/card";
import { DRAGON_COUNT_THRESHOLD, DRAGON_TAG_TABLE, PANDA_COUNT_THRESHOLD, PANDA_TAG_TABLE, dragonTagForRank, pandaTagForRank, type CountCardTrace, type CountPairSignal, type CountRoundTrace } from "../engine/counts";
import type { GameBus } from "./bus";
import { decks, signed, spokenSigned, thresholdDistance, trueCount } from "./count-format";
import { describeRound } from "./count-narration";
import type { GameMode } from "./types";

export interface CountPanelHandle { element: HTMLElement; setMode(mode: GameMode): void; fastForward(): void; openRules(): void; destroy(): void; }
type System = "dragon" | "panda";
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
const threshold = (system: System) => system === "dragon" ? DRAGON_COUNT_THRESHOLD : PANDA_COUNT_THRESHOLD;

function signClass(value: number): string { return value > 0 ? "positive" : value < 0 ? "negative" : "zero"; }
function block(system: System) {
  const el = make("section", "count-block"); el.dataset.bet = system; el.dataset.signal = "off"; el.setAttribute("role", "group");
  const head = make("div", "count-block-head");
  head.append(make("span", "count-glyph", system === "dragon" ? "▲" : "◆"), make("span", "count-name", system === "dragon" ? "DRAGON 7" : "PANDA 8"), make("span", "count-payout", system === "dragon" ? "40:1" : "25:1"));
  const numbers = make("div", "count-numbers");
  const trueWrap = make("div", "count-true-wrap"); trueWrap.append(make("span", "count-label", "TRUE")); const trueValue = make("span", "count-true", "0.0"); trueWrap.append(trueValue);
  const runWrap = make("div", "count-run-wrap"); runWrap.append(make("span", "count-label", "RUN")); const runValue = make("span", "count-running", "0"); runWrap.append(runValue);
  const deltaWrap = make("div", "count-delta-wrap"); deltaWrap.append(make("span", "count-label", "Δ")); const delta = make("span", "count-delta", "—"); deltaWrap.append(delta); numbers.append(trueWrap, runWrap, deltaWrap);
  const verdict = make("div", "count-verdict"); const pill = make("span", "signal-pill", "· NO BET"); const meter = make("div", "meter-wrap"); const track = make("div", "thresh-track"); const fill = make("div", "thresh-fill"); track.append(fill); const caption = make("span", "threshold-caption"); meter.append(track, caption); verdict.append(pill, meter); el.append(head, numbers, verdict);
  return { el, trueValue, runValue, delta, pill, fill, caption };
}

function renderBlock(view: ReturnType<typeof block>, system: System, before: CountPairSignal[System], after: CountPairSignal[System], animate: boolean) {
  const wasSignal = before.signal; const isSignal = after.signal; const delta = after.running - before.running;
  view.el.dataset.signal = isSignal ? "on" : "off";
  view.trueValue.textContent = trueCount(after.true); view.runValue.textContent = signed(after.running); view.delta.textContent = signed(delta);
  view.delta.className = `count-delta ${signClass(delta)}`;
  view.pill.textContent = isSignal ? "✓ BET" : "· NO BET";
  const need = thresholdDistance(Math.abs(threshold(system) - after.true));
  view.caption.textContent = isSignal ? `true ≥ +${threshold(system)} · +${need} over` : `needs true ≥ +${threshold(system)} · ${need} to go`;
  view.fill.style.setProperty("--fill", String(Math.max(0, Math.min(after.true / threshold(system), 1))));
  view.el.setAttribute("aria-label", `${system === "dragon" ? "Dragon 7" : "Panda 8"} count: running ${spokenSigned(after.running)}, true ${trueCount(after.true)}, bet ${isSignal ? "on" : "off"}, threshold plus ${threshold(system)}`);
  if (animate && after.running !== before.running) {
    for (const item of [view.trueValue, view.runValue]) { item.classList.remove("count-tick-up", "count-tick-down"); void item.offsetWidth; item.classList.add(after.running > before.running ? "count-tick-up" : "count-tick-down"); }
  }
  if (animate && wasSignal !== isSignal) { view.pill.classList.remove("signal-flip"); void view.pill.offsetWidth; view.pill.classList.add("signal-flip"); }
}

function traceRow(card: CountCardTrace, seat: string, provisional = false): HTMLLIElement {
  const row = make("li", "trace-row"); const chip = make("span", "rank-chip", card.rank); const seatCell = make("span", "trace-seat", seat);
  if (seat === "BURN") row.dataset.kind = "burn";
  const tag = (value: number) => make("span", `trace-tag ${signClass(value)}`, signed(value));
  const running = (value: number) => make("span", "trace-running", provisional ? "·" : `→ ${signed(value)}`);
  row.append(chip, seatCell, tag(card.dragonTag), running(card.dragonRunningAfter), tag(card.pandaTag), running(card.pandaRunningAfter)); return row;
}

export function mountCountPanel(host: HTMLElement, bus: GameBus): CountPanelHandle {
  const root = make("aside"); root.id = "count-panel"; root.setAttribute("role", "region"); root.setAttribute("aria-label", "Count trainer");
  const head = make("header", "panel-head"); head.append(make("span", "panel-title", "COUNT TRAINER")); const deckReadout = make("span", "deck-readout"); head.append(deckReadout);
  const dragon = block("dragon"), panda = block("panda");
  const trace = make("section", "trace-card"); trace.setAttribute("aria-label", "Count explanation"); const traceHead = make("header", "trace-head"); const traceRound = make("span", "trace-round", "OPENING BURN"); const traceSource = make("span", "trace-src", "1 card seen"); traceHead.append(traceRound, traceSource);
  const columns = make("div", "trace-cols"); for (const label of ["CARD", "SEAT", "D7", "RUN", "P8", "RUN"]) columns.append(make("span", undefined, label));
  const list = make("ol", "trace-list"); list.setAttribute("role", "log"); list.setAttribute("aria-live", "off"); list.tabIndex = 19; const foot = make("p", "trace-foot", "decks unseen = (416 − seen) ÷ 52 · face-down burns count as unseen"); trace.append(traceHead, columns, list, foot);
  const summary = make("section", "delta-summary"); summary.setAttribute("aria-live", "polite");
  const rules = make("details", "rules-card"); const rulesSummary = make("summary", undefined, "Count rules & thresholds"); rulesSummary.tabIndex = 18; rulesSummary.append(make("span", "chev", "▸")); rules.append(rulesSummary);
  for (const [system, tags, limit, copy] of [["dragon", DRAGON_TAG_TABLE, DRAGON_COUNT_THRESHOLD, "Bet at true ≥ +4 · player edge ≈ 8% · fires on ≈ 9.2% of hands"], ["panda", PANDA_TAG_TABLE, PANDA_COUNT_THRESHOLD, "Bet at true ≥ +11 · player edge ≈ 6.3% · fires on ≈ 4.6% of hands"]] as const) {
    const section = make("section", "rules-system"); section.append(make("h3", "rules-name", system === "dragon" ? "DRAGON 7" : "PANDA 8")); const grid = make("div", "tag-grid"); for (const rank of RANKS) { const tag = tags[rank]; const cell = make("span", `tag-cell ${signClass(tag)}`); cell.append(make("span", "tag-rank", rank), make("span", "tag-value", signed(tag))); grid.append(cell); } section.append(grid, make("p", "rules-note", copy)); rules.append(section);
  }
  const retired = make("div", "retired-bar", "SHOE RETIRED · counts reset on the next shoe"); retired.hidden = true;
  const modeHint = make("p", "panel-foot", "Trainer mode · hide the panel to test yourself"); root.append(retired, head, dragon.el, panda.el, trace, summary, rules, modeHint); host.replaceChildren(root);
  try { rules.open = localStorage.getItem("ezbac.rules") === "open"; } catch { /* restricted storage */ }
  rules.addEventListener("toggle", () => { try { localStorage.setItem("ezbac.rules", rules.open ? "open" : "closed"); } catch { /* restricted storage */ } });
  rulesSummary.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") event.stopPropagation(); });
  const openRules = () => { rules.open = true; rules.scrollIntoView({ block: "nearest" }); rulesSummary.focus(); };
  const provisional: { rank: string; seat: string }[] = [];
  const clear = () => { provisional.length = 0; list.replaceChildren(); };
  const reconcile = (roundTrace: CountRoundTrace) => {
    const matches = provisional.length === roundTrace.cards.length && provisional.every((item, index) => item.rank === roundTrace.cards[index]?.rank);
    if (!matches) { list.replaceChildren(...roundTrace.cards.map((card, index) => traceRow(card, provisional[index]?.seat ?? "·"))); }
    else [...list.children].forEach((row, index) => { const card = roundTrace.cards[index]!; row.children[3]!.textContent = `→ ${signed(card.dragonRunningAfter)}`; row.children[5]!.textContent = `→ ${signed(card.pandaRunningAfter)}`; });
    traceSource.textContent = `${roundTrace.cards.length} cards seen`;
  };
  const off = [
    bus.on("shoe:opened", (event) => { clear(); retired.hidden = true; traceRound.textContent = "OPENING BURN"; const burn = event.openingCounts.trace.cards[0]!; list.append(traceRow(burn, "BURN")); const unseen = make("li", "trace-row--unseen", `${event.unseenBurnCount} cards burned face down · uncounted`); list.append(unseen); list.append(make("li", "trace-empty", "Deal a round — the explanation lands here.")); traceSource.textContent = "1 card seen"; renderBlock(dragon, "dragon", event.openingCounts.trace.before.dragon, event.openingCounts.trace.after.dragon, false); renderBlock(panda, "panda", event.openingCounts.trace.before.panda, event.openingCounts.trace.after.panda, false); deckReadout.textContent = `${decks(event.openingCounts.state.decksRemaining)} decks unseen`; const text = describeRound(event.openingCounts.trace); summary.replaceChildren(make("p", "summary-dragon", text.dragon), make("p", "summary-panda", text.panda)); }),
    bus.on("round:start", (event) => { root.classList.remove("speed-fast"); clear(); traceRound.textContent = `ROUND ${event.round}`; traceSource.textContent = "counting…"; summary.replaceChildren(make("p", "summary-pending", "counting…")); }),
    bus.on("card:seen", (event) => { provisional.push({ rank: event.card.rank, seat: event.seat === "player" ? "P" : "B" }); const row = traceRow({ rank: event.card.rank, dragonTag: dragonTagForRank(event.card.rank), pandaTag: pandaTagForRank(event.card.rank), dragonRunningAfter: 0, pandaRunningAfter: 0 }, event.seat === "player" ? "P" : "B", true); row.style.animationDelay = `${(provisional.length - 1) * 45}ms`; list.append(row); }),
    bus.on("round:settled", (event) => { const data = event.result.counts; reconcile(data.trace); renderBlock(dragon, "dragon", data.trace.before.dragon, data.trace.after.dragon, root.dataset.mode !== "casino"); renderBlock(panda, "panda", data.trace.before.panda, data.trace.after.panda, root.dataset.mode !== "casino"); deckReadout.textContent = `${decks(data.state.decksRemaining)} decks unseen`; const text = describeRound(data.trace); summary.replaceChildren(make("p", "summary-dragon", text.dragon), make("p", "summary-panda", text.panda)); }),
    bus.on("shoe:retired", () => { retired.hidden = false; }),
    bus.on("mode:changed", (event) => setMode(event.mode)),
  ];
  const help = () => openRules(); window.addEventListener("ezb:help", help);
  const setMode = (mode: GameMode) => { root.dataset.mode = mode; root.toggleAttribute("inert", mode === "casino"); root.setAttribute("aria-hidden", String(mode === "casino")); if (mode === "trainer") { for (const item of [dragon.trueValue, dragon.runValue, panda.trueValue, panda.runValue, summary]) { item.classList.remove("count-reveal"); void item.offsetWidth; item.classList.add("count-reveal"); } } };
  return { element: root, setMode, fastForward: () => root.classList.add("speed-fast"), openRules, destroy: () => { off.forEach((unsubscribe) => unsubscribe()); window.removeEventListener("ezb:help", help); root.remove(); } };
}
