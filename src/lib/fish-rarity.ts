export const FISH_RARITIES = [
  "eternal",
  "mythic",
  "legend",
  "epic",
  "rare",
] as const;
export type FishRarity = (typeof FISH_RARITIES)[number];

export const FISH_RARITY_LABELS: Record<FishRarity, string> = {
  eternal: "Eternal",
  mythic: "Mythic",
  legend: "Legend",
  epic: "Epic",
  rare: "Rare",
};

export const FISH_RARITY_STYLES: Record<FishRarity, string> = {
  eternal:
    "border-teal-500/40 bg-gradient-to-r from-teal-500/15 via-blue-500/15 to-purple-500/15 text-teal-800 dark:text-teal-200",
  mythic: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  legend:
    "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  epic: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  rare: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};
