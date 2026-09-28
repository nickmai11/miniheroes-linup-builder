import type { Fish } from "@/db/schema";
import { matchesGameLabel } from "./i18n/game-labels";

export type FishCatalogFilters = {
  query: string;
  categories: string[];
  areas: string[];
  qualities: string[];
  specialStats: string[];
};

/** Match any selection within a filter, and every active filter together. */
export function matchesFishFilters(fish: Fish, filters: FishCatalogFilters) {
  return (
    (!filters.categories.length ||
      filters.categories.includes(fish.fishType)) &&
    (!filters.areas.length ||
      (fish.area !== null && filters.areas.includes(fish.area))) &&
    (!filters.qualities.length ||
      (fish.rarity !== null && filters.qualities.includes(fish.rarity))) &&
    (!filters.specialStats.length ||
      filters.specialStats.some((stat) =>
        stat === "any"
          ? fish.specialStats.length > 0
          : stat === "none"
            ? fish.specialStats.length === 0
            : fish.specialStats.includes(stat),
      )) &&
    matchesGameLabel("fish", fish, filters.query)
  );
}
