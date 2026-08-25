import type { CountRoundTrace } from "../engine/counts";
import { DRAGON_COUNT_THRESHOLD, PANDA_COUNT_THRESHOLD } from "../engine/counts";
import { countWord, rankList, signed, trueCount } from "./count-format";

type System = "dragon" | "panda";

function thresholdClause(before: boolean, after: boolean, threshold: number): string {
  const target = `+${threshold}`;
  if (!before && after) return `crossing ${target} — BET NOW`;
  if (before && !after) return `back under ${target} — bet off`;
  return after ? `still over ${target} — keep betting` : `still under ${target}`;
}

function bucketText(cards: readonly { rank: string; tag: number }[]): string {
  return cards.map((bucket) => `${countWord(bucket.rank.split(", ").length)} ${signed(bucket.tag)} card${bucket.rank.includes(",") ? "s" : ""} (${bucket.rank})`).join(" and ");
}

function clauses(trace: CountRoundTrace, system: System, threshold: number): string {
  const entries = trace.cards.map((card, index) => ({ rank: card.rank, tag: system === "dragon" ? card.dragonTag : card.pandaTag, index }));
  const groups = new Map<number, typeof entries>();
  for (const entry of entries) groups.set(entry.tag, [...(groups.get(entry.tag) ?? []), entry]);
  const side = (positive: boolean) => [...groups.entries()]
    .filter(([tag]) => positive ? tag > 0 : tag < 0)
    .sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]) || a[1][0]!.index - b[1][0]!.index)
    .map(([tag, group]) => ({ tag, rank: rankList(group.map((entry) => entry.rank)), total: tag * group.length }));
  const pos = side(true); const neg = side(false);
  const posSum = pos.reduce((sum, bucket) => sum + bucket.total, 0);
  const negSum = neg.reduce((sum, bucket) => sum + bucket.total, 0);
  const net = posSum + negSum;
  const leadingPositive = Math.abs(posSum) > Math.abs(negSum) || (Math.abs(posSum) === Math.abs(negSum) && net > 0);
  const lead = leadingPositive ? pos : neg;
  const oppose = leadingPositive ? neg : pos;
  const neutral = groups.get(0) ?? [];
  const movement = lead.length === 0 && oppose.length === 0
    ? `${countWord(neutral.length)} 0 card${neutral.length === 1 ? "" : "s"} (${rankList(neutral.map((entry) => entry.rank))}) — no movement`
    : `${bucketText(lead)}${oppose.length ? ` against ${bucketText(oppose)}` : ""}${neutral.length ? `; ${countWord(neutral.length)} neutral (${rankList(neutral.map((entry) => entry.rank))})` : ""}`;
  const signalBefore = trace.before[system]; const signalAfter = trace.after[system];
  const title = system === "dragon" ? "Dragon" : "Panda";
  return `${title} ${net === 0 ? "unchanged" : signed(net)}: ${movement}. True ${trueCount(signalBefore.true)} → ${trueCount(signalAfter.true)}, ${thresholdClause(signalBefore.signal, signalAfter.signal, threshold)}.`;
}

export function describeRound(trace: CountRoundTrace): { dragon: string; panda: string } {
  return { dragon: clauses(trace, "dragon", DRAGON_COUNT_THRESHOLD), panda: clauses(trace, "panda", PANDA_COUNT_THRESHOLD) };
}
