import "server-only";
import { cache } from "react";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { heroDetailSeeds, type HeroAwakeningSkill } from "@/data/hero-details";
import { heroSeeds } from "@/data/heroes";
import { ensureDivinitiesSeeded } from "./divinities";
import type {
  Divinity,
  Hero,
  HeroArtifactBonus,
  HeroCore,
  HeroRarity,
  HeroRole,
  HeroSkill,
  Lineup,
} from "@/db/schema";

export { RARITY_LABELS, ROLE_LABELS } from "./hero-labels";

const ROLE_ORDER: HeroRole[] = ["warrior", "marksman", "mage", "support"];
const RARITY_ORDER: HeroRarity[] = ["mythic", "legend", "epic"];

export function sortHeroes<T extends Hero>(list: T[]): T[] {
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

export type HeroWithDivinities = Hero & {
  /** Mythic divinities in slot order (bottom-left, bottom-right). */
  divinities: Divinity[];
};

/**
 * Sync every hero that has a detail seed, so lazily-populated tables like
 * hero_divinities are filled regardless of which hero pages have been opened.
 */
export async function syncSeededHeroDetails() {
  await ensureHeroesSeeded();
  if (Object.keys(heroDetailSeeds).length === 0) return;
  const heroes = await db
    .select({ id: schema.heroes.id, slug: schema.heroes.slug })
    .from(schema.heroes);
  for (const hero of heroes) {
    if (hero.slug in heroDetailSeeds) await syncHeroDetail(hero);
  }
}

/** Mythic divinities per hero id, in slot order (bottom-left, bottom-right). */
export async function divinitiesByHeroIds(
  ids: number[],
): Promise<Map<number, Divinity[]>> {
  const byHero = new Map<number, Divinity[]>();
  if (ids.length === 0) return byHero;
  const rows = await db
    .select({
      heroId: schema.heroDivinities.heroId,
      divinity: schema.divinities,
    })
    .from(schema.heroDivinities)
    .innerJoin(
      schema.divinities,
      eq(schema.heroDivinities.divinityId, schema.divinities.id),
    )
    .where(inArray(schema.heroDivinities.heroId, ids))
    .orderBy(asc(schema.heroDivinities.position));
  for (const { heroId, divinity } of rows) {
    const list = byHero.get(heroId);
    if (list) list.push(divinity);
    else byHero.set(heroId, [divinity]);
  }
  return byHero;
}

/**
 * Attach each hero's mythic divinities for portrait overlays. Callers that may
 * run against an unsynced DB should `syncSeededHeroDetails()` first.
 */
export async function attachDivinities(
  heroes: Hero[],
): Promise<HeroWithDivinities[]> {
  const byHero = await divinitiesByHeroIds(heroes.map((h) => h.id));
  return heroes.map((hero) => ({
    ...hero,
    divinities: byHero.get(hero.id) ?? [],
  }));
}

export async function getAllHeroes(): Promise<HeroWithDivinities[]> {
  await syncSeededHeroDetails();
  const rows = await db
    .select()
    .from(schema.heroes)
    .orderBy(asc(schema.heroes.name));
  return sortHeroes(await attachDivinities(rows));
}

export async function getHeroesByIds(
  ids: number[],
): Promise<HeroWithDivinities[]> {
  if (ids.length === 0) return [];
  await syncSeededHeroDetails();
  const rows = await db
    .select()
    .from(schema.heroes)
    .where(inArray(schema.heroes.id, ids));
  return attachDivinities(rows);
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

/**
 * Make one hero's talents, cores, mythic divinities and artifact name match
 * src/data/hero-details.ts. Skills and cores are matched by name so ids (and
 * core→skill links) survive edits; anything not in the seed is removed.
 * No-op for heroes without a seed.
 */
export async function syncHeroDetail(hero: Pick<Hero, "id" | "slug">) {
  const seed = heroDetailSeeds[hero.slug];
  if (!seed) return;
  await ensureDivinitiesSeeded();
  await db.transaction(async (tx) => {
    // Serialize this hero's sync before checking for existing talents. A new
    // hero can otherwise be seeded simultaneously by separate page requests.
    await tx
      .select({ id: schema.heroes.id })
      .from(schema.heroes)
      .where(eq(schema.heroes.id, hero.id))
      .for("update");
    const existing = await tx
      .select({ id: schema.heroSkills.id, name: schema.heroSkills.name })
      .from(schema.heroSkills)
      .where(eq(schema.heroSkills.heroId, hero.id));
    const skillId = new Map(existing.map((sk) => [sk.name, sk.id]));
    for (const [sortOrder, sk] of seed.skills.entries()) {
      const values = {
        heroId: hero.id,
        kind: sk.kind,
        name: sk.name,
        description: sk.description,
        unlockStars: sk.unlockStars,
        iconUrl: sk.iconUrl ?? null,
        sortOrder,
      };
      const id = skillId.get(sk.name);
      if (id) {
        await tx
          .update(schema.heroSkills)
          .set(values)
          .where(eq(schema.heroSkills.id, id));
      } else {
        const [row] = await tx
          .insert(schema.heroSkills)
          .values(values)
          .returning({ id: schema.heroSkills.id });
        skillId.set(sk.name, row.id);
      }
    }
    const keep = new Set(seed.skills.map((sk) => sk.name));
    const stale = existing
      .filter((sk) => !keep.has(sk.name))
      .map((sk) => sk.id);
    if (stale.length > 0)
      await tx
        .delete(schema.heroSkills)
        .where(inArray(schema.heroSkills.id, stale));

    await tx
      .delete(schema.heroCores)
      .where(eq(schema.heroCores.heroId, hero.id));
    await tx
      .delete(schema.heroArtifactBonuses)
      .where(eq(schema.heroArtifactBonuses.heroId, hero.id));
    if (seed.artifact && seed.artifact.bonuses.length > 0)
      await tx.insert(schema.heroArtifactBonuses).values(
        seed.artifact.bonuses.map((b, sortOrder) => ({
          heroId: hero.id,
          skillId: b.skill ? (skillId.get(b.skill) ?? null) : null,
          tier: b.tier,
          name: b.name ?? null,
          description: b.description,
          sortOrder,
        })),
      );
    if (seed.cores.length > 0)
      await tx.insert(schema.heroCores).values(
        seed.cores.map((c, sortOrder) => ({
          heroId: hero.id,
          skillId: skillId.get(c.skill) ?? null,
          name: c.name,
          description: c.description,
          sortOrder,
        })),
      );

    const divinityRows = await tx
      .select({ id: schema.divinities.id, slug: schema.divinities.slug })
      .from(schema.divinities);
    const divinityId = new Map(divinityRows.map((d) => [d.slug, d.id]));
    await tx
      .delete(schema.heroDivinities)
      .where(eq(schema.heroDivinities.heroId, hero.id));
    const divinities = seed.divinities.flatMap((slug, position) => {
      const id = divinityId.get(slug);
      return id ? [{ heroId: hero.id, divinityId: id, position }] : [];
    });
    if (divinities.length > 0)
      await tx.insert(schema.heroDivinities).values(divinities);

    await tx
      .update(schema.heroes)
      .set({
        artifactName: seed.artifact?.name ?? null,
        artifactIconUrl: seed.artifact?.iconUrl ?? null,
      })
      .where(eq(schema.heroes.id, hero.id));
  });
}

export type HeroDetail = Hero & {
  skills: HeroSkill[];
  awakeningSkills: HeroAwakeningSkill[];
  cores: HeroCore[];
  /** Artifact abilities in tier order; `skillId` links the first three to a talent. */
  artifactBonuses: HeroArtifactBonus[];
  /** Mythic divinities in slot order (bottom-left, bottom-right). */
  divinities: Divinity[];
  /** Saved lineups this hero appears in, newest first. */
  lineups: Lineup[];
};

// Metadata and page rendering share the same load (and seed) within a request.
export const getHeroDetail = cache(
  async (slug: string): Promise<HeroDetail | undefined> => {
    const [found] = await db
      .select({ id: schema.heroes.id, slug: schema.heroes.slug })
      .from(schema.heroes)
      .where(eq(schema.heroes.slug, slug));
    if (!found) return undefined;
    await syncHeroDetail(found);
    const [hero] = await db
      .select()
      .from(schema.heroes)
      .where(eq(schema.heroes.id, found.id));
    const [skills, cores, artifactBonuses, divinityRows, lineupRows] =
      await Promise.all([
        db
          .select()
          .from(schema.heroSkills)
          .where(eq(schema.heroSkills.heroId, hero.id))
          .orderBy(asc(schema.heroSkills.sortOrder)),
        db
          .select()
          .from(schema.heroCores)
          .where(eq(schema.heroCores.heroId, hero.id))
          .orderBy(asc(schema.heroCores.sortOrder)),
        db
          .select()
          .from(schema.heroArtifactBonuses)
          .where(eq(schema.heroArtifactBonuses.heroId, hero.id))
          .orderBy(asc(schema.heroArtifactBonuses.sortOrder)),
        db
          .select({ divinity: schema.divinities })
          .from(schema.heroDivinities)
          .innerJoin(
            schema.divinities,
            eq(schema.heroDivinities.divinityId, schema.divinities.id),
          )
          .where(eq(schema.heroDivinities.heroId, hero.id))
          .orderBy(asc(schema.heroDivinities.position)),
        db
          .select({ lineup: schema.lineups })
          .from(schema.lineupHeroes)
          .innerJoin(
            schema.lineups,
            eq(schema.lineupHeroes.lineupId, schema.lineups.id),
          )
          .where(eq(schema.lineupHeroes.heroId, hero.id))
          .orderBy(desc(schema.lineups.createdAt)),
      ]);
    return {
      ...hero,
      skills,
      awakeningSkills: heroDetailSeeds[hero.slug]?.awakeningSkills ?? [],
      cores,
      artifactBonuses,
      divinities: divinityRows.map((r) => r.divinity),
      lineups: lineupRows.map((r) => r.lineup),
    };
  },
);
