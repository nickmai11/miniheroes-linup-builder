import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { BUILD_PRIORITIES } from "@/lib/build-priorities";
import { MAX_FISH_QUANTITY } from "@/lib/fish-selection";
import { FISH_RARITIES } from "@/lib/fish-rarity";
import type { ChangeEvent, ChangeField, ChangeKind } from "@/lib/change-types";

/** Personal subscriptions survive target deletion so its final change stays in the feed. */
export const contentFollows = pgTable(
  "content_follows",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    followerKey: text("follower_key").notNull(),
    kind: text("kind", { enum: ["lineup", "hero"] }).notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.followerKey, t.kind, t.targetId),
    check("content_follows_kind", sql`${t.kind} in ('lineup', 'hero')`),
  ],
);

/** Retained after deletion; access is checked against the current target. */
export const contentChanges = pgTable(
  "content_changes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    kind: text("kind").$type<ChangeKind>().notNull(),
    targetId: integer("target_id").notNull(),
    name: text("name").notNull(),
    heroName: text("hero_name"),
    heroSlug: text("hero_slug"),
    event: text("event").$type<ChangeEvent>().notNull(),
    fields: jsonb("fields").$type<ChangeField[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("content_changes_target_idx").on(t.kind, t.targetId, t.id),
    check("content_changes_kind", sql`${t.kind} in ('lineup', 'build')`),
    check(
      "content_changes_event",
      sql`${t.event} in ('created', 'updated', 'imported', 'deleted')`,
    ),
  ],
);

export const notes = pgTable("notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

/** Exact page paths the owner has made readable without an invitation. */
export const publicUrls = pgTable("public_urls", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  path: text("path").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invitationCodes = pgTable("invitation_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  codeHash: text("code_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  // Null means a standalone invitation to the full library.
  lineupId: integer("lineup_id").references(() => lineups.id, {
    onDelete: "cascade",
  }),
});

export const registeredDevices = pgTable("registered_devices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tokenHash: text("token_hash").notNull().unique(),
  invitationId: integer("invitation_id")
    .unique()
    .references(() => invitationCodes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Each invitation belongs to one device; a device can redeem many invitations. */
export const invitationRedemptions = pgTable(
  "invitation_redemptions",
  {
    invitationId: integer("invitation_id")
      .primaryKey()
      .references(() => invitationCodes.id, { onDelete: "cascade" }),
    deviceId: integer("device_id")
      .notNull()
      .references(() => registeredDevices.id, { onDelete: "cascade" }),
  },
  (t) => [index("invitation_redemptions_device_id_idx").on(t.deviceId)],
);

// The game has exactly four hero classes.
export const HERO_ROLES = ["warrior", "marksman", "mage", "support"] as const;
export type HeroRole = (typeof HERO_ROLES)[number];

export const HERO_RARITIES = ["eternal", "mythic", "legend", "epic"] as const;
export type HeroRarity = (typeof HERO_RARITIES)[number];

export const heroes = pgTable("heroes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: HERO_ROLES }).notNull(),
  rarity: text("rarity", { enum: HERO_RARITIES }).notNull(),
  // Path under /public (e.g. "/heroes/monkey-king.png") or null for no portrait.
  imageUrl: text("image_url"),
  // Divine weapon name and image from the Artifact tab (e.g. "Siren Blade").
  artifactName: text("artifact_name"),
  artifactIconUrl: text("artifact_icon_url"),
  // Fingerprint of the last successfully synchronized detail seed.
  detailSeedHash: text("detail_seed_hash"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Hero = typeof heroes.$inferSelect;
export type NewHero = typeof heroes.$inferInsert;

/**
 * Artifact quality tiers in unlock order. Bonuses can modify a talent or add
 * a standalone artifact skill; rainbow is not necessarily standalone.
 */
export const ARTIFACT_TIERS = ["purple", "gold", "red", "rainbow"] as const;
export type ArtifactTier = (typeof ARTIFACT_TIERS)[number];

/**
 * Talent kinds from the in-game Talent tab (Ultimate Skill, Special Skill,
 * Battle Skill, Enhance, Attribute, Passive, Aura).
 */
export const SKILL_KINDS = [
  "ultimate",
  "battle",
  "special",
  "attribute",
  "enhance",
  "passive",
  "aura",
] as const;
export type SkillKind = (typeof SKILL_KINDS)[number];

export const heroSkills = pgTable(
  "hero_skills",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: SKILL_KINDS }).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // Star progress that unlocks the talent (2/5/8/12/16 clockwise around the
    // ring); 0 for the ultimate.
    unlockStars: integer("unlock_stars"),
    // Path under /public (e.g. "/talents/sea-captain/ghost-ship.png").
    iconUrl: text("icon_url"),
    // Display order (0 = ultimate, then the ring, then the artifact ability).
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("hero_skills_hero_id_idx").on(t.heroId)],
);

export type HeroSkill = typeof heroSkills.$inferSelect;

/**
 * The abilities of a hero's artifact, one per quality tier. Talent bonuses use
 * `skillId`; standalone abilities have a `name` and no talent. Rainbow can be
 * either (Thrall's rainbow bonus modifies Thunder Strike).
 */
export const heroArtifactBonuses = pgTable(
  "hero_artifact_bonuses",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    skillId: integer("skill_id").references(() => heroSkills.id, {
      onDelete: "set null",
    }),
    tier: text("tier", { enum: ARTIFACT_TIERS }).notNull(),
    // Standalone ability name; null when attached to a talent.
    name: text("name"),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("hero_artifact_bonuses_hero_id_idx").on(t.heroId)],
);

export type HeroArtifactBonus = typeof heroArtifactBonuses.$inferSelect;

/** The four `<Gear>·Core` bonuses; each modifies one talent. */
export const heroCores = pgTable(
  "hero_cores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    skillId: integer("skill_id").references(() => heroSkills.id, {
      onDelete: "set null",
    }),
    // Gear name without the "·Core" suffix, e.g. "Cavalier Helm".
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("hero_cores_hero_id_idx").on(t.heroId)],
);

export type HeroCore = typeof heroCores.$inferSelect;

/**
 * Divinities: the per-stat badges ringed around a hero's divine weapon, levelled
 * with divinity gems. Named by the stat row of the in-game popup without the
 * leading "All" (e.g. "DMG Reduction", "Physical RES", "Warrior ATK"); `kind` is
 * the display category, with owner corrections overriding the popup title.
 */
export const divinities = pgTable("divinities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  // Path under /public (e.g. "/divinities/physical-res.png").
  iconUrl: text("icon_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Divinity = typeof divinities.$inferSelect;
export type NewDivinity = typeof divinities.$inferInsert;

/**
 * A hero's mythic (red) divinities from the Artifact tab: position 0 is the
 * bottom-left badge, 1 the bottom-right. Non-mythic badges are not recorded.
 */
export const heroDivinities = pgTable(
  "hero_divinities",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    divinityId: integer("divinity_id")
      .notNull()
      .references(() => divinities.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [
    unique().on(t.heroId, t.position),
    index("hero_divinities_divinity_id_idx").on(t.divinityId),
  ],
);

export type HeroDivinity = typeof heroDivinities.$inferSelect;

/**
 * Weapon attributes: the catalog of random "Additional Attributes" a weapon can
 * roll, as listed in the in-game "Possible Attributes" popup. Each weapon draws
 * from its own subset of this catalog (not recorded yet). Weapons are their own
 * system, unrelated to divinities (owner), even where names look alike.
 */
export const weaponAttributes = pgTable("weapon_attributes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  // Exactly as printed in the popup, e.g. "Melee DMG Reduct".
  name: text("name").notNull(),
  // Display order (popup reading order, grouped by stat family).
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WeaponAttribute = typeof weaponAttributes.$inferSelect;
export type NewWeaponAttribute = typeof weaponAttributes.$inferInsert;

/** Relic names and icons from the owner's Relic Archive screenshots. */
export const relics = pgTable("relics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  iconUrl: text("icon_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Relic = typeof relics.$inferSelect;
export type NewRelic = typeof relics.$inferInsert;

/** Pets recorded from the owner's Activated Pets popups. */
export const pets = pgTable("pets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  iconUrl: text("icon_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

/** Bait catalog from the owner's shop screenshots. */
export const baits = pgTable("baits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull().unique(),
  iconUrl: text("icon_url").notNull(),
  description: text("description").notNull(),
  fishType: text("fish_type"),
  bonuses: jsonb("bonuses")
    .$type<{ name: string; percent: number }[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Bait = typeof baits.$inferSelect;

export const fishRarity = pgEnum("fish_rarity", FISH_RARITIES);

/** Fish catalog from the owner's area sheets, used by lineup selections. */
export const fishes = pgTable("fishes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  // Null only for entries whose screenshot rarity has not been recorded.
  rarity: fishRarity("rarity"),
  area: text("area").notNull().default(""),
  fishType: text("fish_type").notNull().default(""),
  collection: text("collection").notNull().default(""),
  stats: text("stats").array().notNull().default([]),
  baseStats: text("base_stats").array().notNull().default([]),
  specialStats: text("special_stats").array().notNull().default([]),
  bait: text("bait").references(() => baits.name, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Fish = typeof fishes.$inferSelect;
export type NewFish = typeof fishes.$inferInsert;

/** The four rune types of the hero's Rune tab. */
export const RUNE_TYPES = ["attack", "effect", "energy", "survival"] as const;
export type RuneType = (typeof RUNE_TYPES)[number];

/**
 * Rune attributes: every stat a rune of a given type can roll, with the highest
 * value it can reach (`maxValue`, a percentage when `isPercent`, otherwise a
 * flat amount such as energy points), the in-game description and the owner's
 * analysis of how useful it is. Read from the owner's sheets in gameplay/runes.
 */
export const runeAttributes = pgTable(
  "rune_attributes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    runeType: text("rune_type", { enum: RUNE_TYPES }).notNull(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    maxValue: real("max_value").notNull(),
    isPercent: boolean("is_percent").notNull().default(true),
    description: text("description").notNull().default(""),
    analysis: text("analysis").notNull().default(""),
    // Display order within the rune type (the sheet's row order).
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("rune_attributes_rune_type_idx").on(t.runeType)],
);

export type RuneAttribute = typeof runeAttributes.$inferSelect;
export type NewRuneAttribute = typeof runeAttributes.$inferInsert;

/**
 * A hero build: the owner's recommended rune attributes, weapon attributes and
 * cores for one hero, picked by hand. A hero can have several
 * (e.g. per mode or per role in the lineup).
 */
export const heroBuilds = pgTable(
  "hero_builds",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("hero_builds_hero_id_idx").on(t.heroId)],
);

export type HeroBuildRow = typeof heroBuilds.$inferSelect;

export const buildPriority = pgEnum("build_priority", BUILD_PRIORITIES);

/** Rune attributes with an explicit tier; sortOrder preserves pick order within it. */
export const heroBuildRunes = pgTable(
  "hero_build_runes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    buildId: integer("build_id")
      .notNull()
      .references(() => heroBuilds.id, { onDelete: "cascade" }),
    runeAttributeId: integer("rune_attribute_id")
      .notNull()
      .references(() => runeAttributes.id, { onDelete: "cascade" }),
    priority: buildPriority("priority").notNull().default("optional"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.buildId, t.runeAttributeId),
    index("hero_build_runes_rune_attribute_id_idx").on(t.runeAttributeId),
  ],
);

/** Weapon attributes with an explicit tier and stable pick order. */
export const heroBuildWeapons = pgTable(
  "hero_build_weapons",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    buildId: integer("build_id")
      .notNull()
      .references(() => heroBuilds.id, { onDelete: "cascade" }),
    weaponAttributeId: integer("weapon_attribute_id")
      .notNull()
      .references(() => weaponAttributes.id, { onDelete: "cascade" }),
    priority: buildPriority("priority").notNull().default("optional"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.buildId, t.weaponAttributeId),
    index("hero_build_weapons_weapon_attribute_id_idx").on(t.weaponAttributeId),
  ],
);

/** Hero-specific cores with an explicit tier and stable pick order. */
export const heroBuildCores = pgTable(
  "hero_build_cores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    buildId: integer("build_id")
      .notNull()
      .references(() => heroBuilds.id, { onDelete: "cascade" }),
    coreId: integer("core_id")
      .notNull()
      .references(() => heroCores.id, { onDelete: "cascade" }),
    priority: buildPriority("priority").notNull().default("optional"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.buildId, t.coreId),
    index("hero_build_cores_core_id_idx").on(t.coreId),
  ],
);

export const LINEUP_SIZE = 5;

export const lineups = pgTable("lineups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lineup = typeof lineups.$inferSelect;

/** One current reaction per voter and saved lineup/build. */
export const contentVotes = pgTable(
  "content_votes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    lineupId: integer("lineup_id").references(() => lineups.id, {
      onDelete: "cascade",
    }),
    buildId: integer("build_id").references(() => heroBuilds.id, {
      onDelete: "cascade",
    }),
    voterKey: text("voter_key").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [
    unique().on(t.lineupId, t.voterKey),
    unique().on(t.buildId, t.voterKey),
    check(
      "content_votes_one_target",
      sql`(${t.lineupId} is not null) <> (${t.buildId} is not null)`,
    ),
    check("content_votes_value", sql`${t.value} in (-1, 1)`),
  ],
);

/** Fish selections belong to the whole lineup and preserve selection order. */
export const lineupFishes = pgTable(
  "lineup_fishes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    lineupId: integer("lineup_id")
      .notNull()
      .references(() => lineups.id, { onDelete: "cascade" }),
    fishId: integer("fish_id")
      .notNull()
      .references(() => fishes.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.lineupId, t.fishId),
    index("lineup_fishes_fish_id_idx").on(t.fishId),
    check(
      "lineup_fishes_quantity_range",
      sql`${t.quantity} between 1 and ${MAX_FISH_QUANTITY}`.inlineParams(),
    ),
  ],
);

export const lineupHeroes = pgTable(
  "lineup_heroes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    lineupId: integer("lineup_id")
      .notNull()
      .references(() => lineups.id, { onDelete: "cascade" }),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    // 0-based slot index within the lineup.
    position: integer("position").notNull(),
    buildId: integer("build_id").references(() => heroBuilds.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    unique().on(t.lineupId, t.position),
    index("lineup_heroes_hero_id_idx").on(t.heroId),
    index("lineup_heroes_build_id_idx").on(t.buildId),
  ],
);

export type LineupHero = typeof lineupHeroes.$inferSelect;

/** Catalog assignments belong to a hero in one lineup, not the global hero. */
export const lineupHeroPets = pgTable(
  "lineup_hero_pets",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    lineupHeroId: integer("lineup_hero_id")
      .notNull()
      .references(() => lineupHeroes.id, { onDelete: "cascade" }),
    petId: integer("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.lineupHeroId, t.petId),
    index("lineup_hero_pets_pet_id_idx").on(t.petId),
  ],
);

export const lineupHeroRelics = pgTable(
  "lineup_hero_relics",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    lineupHeroId: integer("lineup_hero_id")
      .notNull()
      .references(() => lineupHeroes.id, { onDelete: "cascade" }),
    relicId: integer("relic_id")
      .notNull()
      .references(() => relics.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.lineupHeroId, t.relicId),
    index("lineup_hero_relics_relic_id_idx").on(t.relicId),
  ],
);
