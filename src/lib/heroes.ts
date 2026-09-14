import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { heroDetailSeeds, type HeroAwakeningSkill } from "@/data/hero-details";
import { heroSeeds } from "@/data/heroes";
import { ensureDivinitiesSeeded } from "./divinities";
import { onceAsync } from "@/lib/once-async";
import { getHeroIdsWithBuilds } from "./builds";
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
const RARITY_ORDER: HeroRarity[] = ["eternal", "mythic", "legend", "epic"];

// Only persisted fields belong here; awakening skills are served from the file.
// Bump the version if the synchronization rules change without a seed edit.
const DETAIL_SEED_HASHES = new Map(
  Object.entries(heroDetailSeeds).map(([slug, seed]) => [
    slug,
    createHash("sha256")
      .update(
        JSON.stringify([
          1,
          seed.skills,
          seed.cores,
          seed.artifact ?? null,
          seed.divinities,
        ]),
      )
      .digest("hex"),
  ]),
);

export function sortHeroes<T extends Hero>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
      a.name.localeCompare(b.name),
  );
}

/** Insert any seed heroes that aren't in the table yet. Safe to call repeatedly. */
export const ensureHeroesSeeded = onceAsync(async () => {
  await db
    .insert(schema.heroes)
    .values(heroSeeds)
    .onConflictDoNothing({ target: schema.heroes.slug });
});

export type HeroWithDivinities = Hero & {
  /** Mythic divinities in slot order (bottom-left, bottom-right). */
  divinities: Divinity[];
  /** Whether this hero has any saved build, regardless of lineup assignments. */
  hasBuild: boolean;
};

/**
 * Sync every hero that has a detail seed, so lazily-populated tables like
 * hero_divinities are filled regardless of which hero pages have been opened.
 */
export const syncSeededHeroDetails = cache(async () => {
  await ensureHeroesSeeded();
  if (Object.keys(heroDetailSeeds).length === 0) return;
  const heroes = await db
    .select({
      id: schema.heroes.id,
      slug: schema.heroes.slug,
      detailSeedHash: schema.heroes.detailSeedHash,
    })
    .from(schema.heroes)
    .where(inArray(schema.heroes.slug, getRecordedHeroSlugs()));
  for (const hero of heroes) {
    if (hero.slug in heroDetailSeeds) await syncHeroDetail(hero);
  }
});

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
 * Attach each hero's mythic divinities and build availability for portrait overlays. Callers that may
 * run against an unsynced DB should `syncSeededHeroDetails()` first.
 */
export async function attachDivinities(
  heroes: Hero[],
): Promise<HeroWithDivinities[]> {
  const ids = heroes.map((hero) => hero.id);
  const [byHero, heroIdsWithBuilds] = await Promise.all([
    divinitiesByHeroIds(ids),
    getHeroIdsWithBuilds(ids),
  ]);
  return heroes.map((hero) => ({
    ...hero,
    divinities: byHero.get(hero.id) ?? [],
    hasBuild: heroIdsWithBuilds.has(hero.id),
  }));
}

/** Detail seeds determine listing visibility, including partly recorded heroes. */
export function getRecordedHeroSlugs(): string[] {
  return Object.keys(heroDetailSeeds);
}

/** Heroes available to browse or pick, with their recorded detail content. */
export async function getHeroesWithDetails(): Promise<HeroWithDivinities[]> {
  const slugs = getRecordedHeroSlugs();
  if (slugs.length === 0) return [];
  await syncSeededHeroDetails();
  const rows = await db
    .select()
    .from(schema.heroes)
    .where(inArray(schema.heroes.slug, slugs))
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
 * Unchanged seeds need no writes. The fingerprint commits with the content so
 * failures retry and separate server processes agree on what has been synced.
 */
export async function syncHeroDetail(
  hero: Pick<Hero, "id" | "slug"> & Partial<Pick<Hero, "detailSeedHash">>,
): Promise<boolean> {
  const seed = heroDetailSeeds[hero.slug];
  const detailSeedHash = DETAIL_SEED_HASHES.get(hero.slug);
  if (!seed || !detailSeedHash || hero.detailSeedHash === detailSeedHash)
    return false;
  await ensureDivinitiesSeeded();
  return db.transaction(async (tx) => {
    // Serialize this hero's sync before checking for existing talents. A new
    // hero can otherwise be seeded simultaneously by separate page requests.
    const [locked] = await tx
      .select({ detailSeedHash: schema.heroes.detailSeedHash })
      .from(schema.heroes)
      .where(eq(schema.heroes.id, hero.id))
      .for("update");
    if (!locked || locked.detailSeedHash === detailSeedHash) return false;
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
    // Keep core ids stable: saved builds reference these rows across page loads.
    const existingCores = await tx
      .select({ id: schema.heroCores.id, name: schema.heroCores.name })
      .from(schema.heroCores)
      .where(eq(schema.heroCores.heroId, hero.id));
    const coreId = new Map(existingCores.map((c) => [c.name, c.id]));
    for (const [sortOrder, c] of seed.cores.entries()) {
      const values = {
        heroId: hero.id,
        skillId: skillId.get(c.skill) ?? null,
        name: c.name,
        description: c.description,
        sortOrder,
      };
      const id = coreId.get(c.name);
      if (id) {
        await tx
          .update(schema.heroCores)
          .set(values)
          .where(eq(schema.heroCores.id, id));
      } else {
        await tx.insert(schema.heroCores).values(values);
      }
    }
    const keepCores = new Set(seed.cores.map((c) => c.name));
    const staleCores = existingCores
      .filter((c) => !keepCores.has(c.name))
      .map((c) => c.id);
    if (staleCores.length > 0)
      await tx
        .delete(schema.heroCores)
        .where(inArray(schema.heroCores.id, staleCores));

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
        detailSeedHash,
      })
      .where(eq(schema.heroes.id, hero.id));
    return true;
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
    let [hero] = await db
      .select()
      .from(schema.heroes)
      .where(eq(schema.heroes.slug, slug));
    if (!hero) return undefined;
    if (
      heroDetailSeeds[slug] &&
      hero.detailSeedHash !== DETAIL_SEED_HASHES.get(slug)
    ) {
      await syncHeroDetail(hero);
      // Another request may have completed the sync while we waited for its
      // lock. Refresh the hero fields even when that request did the writes.
      [hero] = await db
        .select()
        .from(schema.heroes)
        .where(eq(schema.heroes.id, hero.id));
      if (!hero) return undefined;
    }
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
