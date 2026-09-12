import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { heroDetailSeeds } from "@/data/hero-details";
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
  cores: HeroCore[];
  /** Artifact abilities in tier order; `skillId` links the first three to a talent. */
  artifactBonuses: HeroArtifactBonus[];
  /** Mythic divinities in slot order (bottom-left, bottom-right). */
  divinities: Divinity[];
  /** Saved lineups this hero appears in, newest first. */
  lineups: Lineup[];
};

export async function getHeroDetail(
  slug: string,
): Promise<HeroDetail | undefined> {
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
    cores,
    artifactBonuses,
    divinities: divinityRows.map((r) => r.divinity),
    lineups: lineupRows.map((r) => r.lineup),
  };
}
