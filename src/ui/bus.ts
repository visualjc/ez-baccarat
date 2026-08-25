import type { Card } from "../engine/card";
import type { RoundResult } from "../engine/engine";
import type { CountRoundResult } from "../engine/counts";

export type GameEvent =
  | { type: "shoe:opened"; exposedBurnCard: Card; unseenBurnCount: number; cardsRemaining: number; openingCounts: CountRoundResult }
  | { type: "round:start"; round: number }
  | { type: "card:seen"; card: Card; seat: "player" | "banker"; index: number }
  | { type: "round:settled"; result: RoundResult; cardsRemaining: number }
  | { type: "shoe:retired" }
  | { type: "mode:changed"; mode: "trainer" | "casino" }
  | { type: "bankroll:changed"; bankroll: number; delta: number };

export interface GameBus {
  emit(event: GameEvent): void;
  on<T extends GameEvent["type"]>(
    type: T,
    fn: (event: Extract<GameEvent, { type: T }>) => void,
  ): () => void;
}

export function createBus(): GameBus {
  const listeners = new Map<GameEvent["type"], Set<(event: GameEvent) => void>>();

  return {
    emit(event) {
      const handlers = listeners.get(event.type);
      if (!handlers) {
        return;
      }
      handlers.forEach((handler) => handler(event));
    },
    on(type, fn) {
      const bucket = listeners.get(type) ?? new Set<(event: GameEvent) => void>();
      const wrapped = fn as (event: GameEvent) => void;
      bucket.add(wrapped);
      listeners.set(type, bucket);
      return () => {
        bucket.delete(wrapped);
        if (bucket.size === 0) {
          listeners.delete(type);
        }
      };
    },
  };
}
