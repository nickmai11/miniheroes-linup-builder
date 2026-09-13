import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Divinity, Hero } from "@/db/schema";
import { ensureDivinitiesSeeded } from "./divinities";
import { sortHeroes, syncSeededHeroDetails } from "./heroes";

export async function getDivinityBySlug(
  slug: string,
): Promise<Divinity | undefined> {
  await ensureDivinitiesSeeded();
  const [row] = await db
    .select()
    .from(schema.divinities)
    .where(eq(schema.divinities.slug, slug));
  return row;
}

/**
 * Heroes whose mythic divinities include this one, in roster order. Every hero
 * with a detail seed is synced first, so the answer does not depend on which
 * hero pages have been opened.
 */
export async function getHeroesWithDivinity(
  divinityId: number,
): Promise<Hero[]> {
  await syncSeededHeroDetails();
  const rows = await db
    .select({ hero: schema.heroes })
    .from(schema.heroDivinities)
    .innerJoin(
      schema.heroes,
      eq(schema.heroDivinities.heroId, schema.heroes.id),
    )
    .where(eq(schema.heroDivinities.divinityId, divinityId))
    .orderBy(asc(schema.heroDivinities.position));
  const unique = new Map(rows.map((r) => [r.hero.id, r.hero]));
  return sortHeroes([...unique.values()]);
}
