import "server-only";
import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Divinity } from "@/db/schema";
import { ensureDivinitiesSeeded } from "./divinities";
import {
  attachDivinities,
  getRecordedHeroSlugs,
  sortHeroes,
  syncSeededHeroDetails,
  type HeroWithDivinities,
} from "./heroes";

export const getDivinityBySlug = cache(async function getDivinityBySlug(
  slug: string,
): Promise<Divinity | undefined> {
  await ensureDivinitiesSeeded();
  const [row] = await db
    .select()
    .from(schema.divinities)
    .where(eq(schema.divinities.slug, slug));
  return row;
});

/**
 * Recorded heroes whose mythic divinities include this one, in roster order. Every hero
 * with a detail seed is synced first, so the answer does not depend on which
 * hero pages have been opened.
 */
export async function getHeroesWithDivinity(
  divinityId: number,
): Promise<HeroWithDivinities[]> {
  const slugs = getRecordedHeroSlugs();
  if (slugs.length === 0) return [];
  await syncSeededHeroDetails();
  const rows = await db
    .select({ hero: schema.heroes })
    .from(schema.heroDivinities)
    .innerJoin(
      schema.heroes,
      eq(schema.heroDivinities.heroId, schema.heroes.id),
    )
    .where(
      and(
        eq(schema.heroDivinities.divinityId, divinityId),
        inArray(schema.heroes.slug, slugs),
      ),
    )
    .orderBy(asc(schema.heroDivinities.position));
  const unique = new Map(rows.map((r) => [r.hero.id, r.hero]));
  return attachDivinities(sortHeroes([...unique.values()]));
}
