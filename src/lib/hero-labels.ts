// Client-safe display labels (no DB imports here).
import type {
  ArtifactTier,
  HeroRarity,
  HeroRole,
  SkillKind,
} from "@/db/schema";

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

export const SKILL_KIND_LABELS: Record<SkillKind, string> = {
  ultimate: "Ultimate Skill",
  battle: "Battle Skill",
  special: "Special Skill",
  attribute: "Attribute",
  enhance: "Enhance",
  passive: "Passive",
};

export const ARTIFACT_TIER_LABELS: Record<ArtifactTier, string> = {
  purple: "Purple",
  gold: "Gold",
  red: "Red",
  rainbow: "Rainbow",
};
