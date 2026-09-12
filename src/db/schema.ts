import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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

// The game has exactly four hero classes.
export const HERO_ROLES = ["warrior", "marksman", "mage", "support"] as const;
export type HeroRole = (typeof HERO_ROLES)[number];

export const HERO_RARITIES = ["mythic", "legend", "epic"] as const;
export type HeroRarity = (typeof HERO_RARITIES)[number];

export const heroes = pgTable("heroes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: HERO_ROLES }).notNull(),
  rarity: text("rarity", { enum: HERO_RARITIES }).notNull(),
  // Path under /public (e.g. "/heroes/monkey-king.png") or null for no portrait.
  imageUrl: text("image_url"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Hero = typeof heroes.$inferSelect;
export type NewHero = typeof heroes.$inferInsert;

/**
 * The six skill slots shown on a hero's in-game detail card:
 * Ultimate Skill, Battle Skill, Special Skill, Attribute, and two Enhance slots.
 */
export const SKILL_KINDS = [
  "ultimate",
  "battle",
  "special",
  "attribute",
  "enhance",
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
    // Display order on the card (0-5).
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("hero_skills_hero_id_idx").on(t.heroId)],
);

export type HeroSkill = typeof heroSkills.$inferSelect;

/**
 * Divinities: the per-stat badges ringed around a hero's divine weapon, levelled
 * with divinity gems. Named by the stat row of the in-game popup without the
 * leading "All" (e.g. "DMG Reduction", "Physical RES", "Warrior ATK"); `kind` is
 * the popup title without " Divinity" (e.g. "DMG Reduction", "RES", "ATK").
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
  },
  (t) => [
    unique().on(t.lineupId, t.position),
    index("lineup_heroes_hero_id_idx").on(t.heroId),
  ],
);

export type LineupHero = typeof lineupHeroes.$inferSelect;
