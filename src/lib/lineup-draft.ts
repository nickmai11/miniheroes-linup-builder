import type { LineupSlotInput } from "@/lib/lineup-input";
import type { LineupWithHeroes } from "@/lib/lineups";
import type { FishSelection } from "@/lib/fish-selection";

export type LineupDraft = {
  id?: number;
  name: string;
  description: string;
  fishSelections: FishSelection[];
  slots: LineupSlotInput[];
};

/** A copy has no save target, so saving creates a new lineup. */
export function createLineupDraft(
  lineup: LineupWithHeroes,
  asCopy = false,
): LineupDraft {
  const suffix = " (copy)";
  return {
    ...(asCopy ? {} : { id: lineup.id }),
    name: asCopy
      ? `${lineup.name.slice(0, 120 - suffix.length)}${suffix}`
      : lineup.name,
    description: lineup.description,
    fishSelections: lineup.fishes.map((fish) => ({
      fishId: fish.id,
      quantity: fish.quantity,
    })),
    slots: lineup.slots.map((hero) =>
      hero
        ? {
            heroId: hero.id,
            buildId: hero.build?.id ?? null,
            petIds: hero.pets.map((pet) => pet.id),
            relicIds: hero.relics.map((relic) => relic.id),
          }
        : null,
    ),
  };
}
