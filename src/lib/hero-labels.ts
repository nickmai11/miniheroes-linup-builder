// Client-safe display labels (no DB imports here).
import type { HeroRarity, HeroRole } from "@/db/schema";

export const ROLE_LABELS: Record<HeroRole, string> = {
  warrior: "Warrior",
  marksman: "Marksman",
  mage: "Mage",
  support: "Support",
};

export const RARITY_LABELS: Record<HeroRarity, string> = {
  mythic: "Mythic",
  legend: "Legend",
  epic: "Epic",
};
