import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { heroSeeds } from "@/data/heroes";
import type { Hero, HeroRarity, HeroRole } from "@/db/schema";

export { RARITY_LABELS, ROLE_LABELS } from "./hero-labels";

const ROLE_ORDER: HeroRole[] = ["warrior", "marksman", "mage", "support"];
const RARITY_ORDER: HeroRarity[] = ["mythic", "legend", "epic"];

export function sortHeroes(list: Hero[]): Hero[] {
  return [...list].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
      a.name.localeCompare(b.name),
  );
}

/** Insert any seed heroes that aren't in the table yet. Safe to call repeatedly. */
export async function ensureHeroesSeeded() {
  await db
    .insert(schema.heroes)
    .values(heroSeeds)
    .onConflictDoNothing({ target: schema.heroes.slug });
}

export async function getAllHeroes(): Promise<Hero[]> {
  await ensureHeroesSeeded();
  const rows = await db
    .select()
    .from(schema.heroes)
    .orderBy(asc(schema.heroes.name));
  return sortHeroes(rows);
}

export async function getHeroesByIds(ids: number[]): Promise<Hero[]> {
  if (ids.length === 0) return [];
  return db.select().from(schema.heroes).where(inArray(schema.heroes.id, ids));
}

export async function getHeroById(id: number): Promise<Hero | undefined> {
  const [row] = await db
    .select()
    .from(schema.heroes)
    .where(eq(schema.heroes.id, id));
  return row;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
