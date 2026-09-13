export const FISH_CATEGORIES = ["Small", "Medium", "Large", "Aquatic"] as const;
export const MAX_FISH_QUANTITY = 4;

export type FishSelection = { fishId: number; quantity: number };
