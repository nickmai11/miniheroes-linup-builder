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
