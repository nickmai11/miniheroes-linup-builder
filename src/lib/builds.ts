import "server-only";
import { getViewerKey } from "@/lib/viewer-profile";
import { getAdminId } from "@/lib/admin-access";
import { buildPrivacyFilter, buildReadFilter } from "@/lib/build-privacy";
import { matchingGameSlugs } from "@/lib/i18n/game-labels";
import { and, asc, eq, ilike, inArray, ne, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { HeroBuild, ImportableBuildPage } from "@/lib/build-types";

/** Build availability for a set of portraits, without loading build contents. */
export async function getHeroIdsWithBuilds(
  heroIds: number[],
): Promise<Set<number>> {
  if (heroIds.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ heroId: schema.heroBuilds.heroId })
    .from(schema.heroBuilds)
    .where(
      and(
        inArray(schema.heroBuilds.heroId, heroIds),
        buildReadFilter(await getAdminId(), await getViewerKey()),
      ),
    );
  return new Set(rows.map((row) => row.heroId));
}

/**
 * A hero's builds, oldest first, each with its chosen rune attributes, weapon
 * attributes and cores in pick order, with each selection's saved priority tier.
 */
export async function getHeroBuilds(heroId: number): Promise<HeroBuild[]> {
  return getBuildsForHeroes([heroId]);
}

export async function getBuildsForHeroes(
  heroIds: number[],
): Promise<HeroBuild[]> {
  if (heroIds.length === 0) return [];
  return loadBuilds(inArray(schema.heroBuilds.heroId, heroIds));
}

export async function getBuildsByIds(ids: number[]): Promise<HeroBuild[]> {
  if (ids.length === 0) return [];
  return loadBuilds(inArray(schema.heroBuilds.id, ids));
}

async function loadBuilds(where: SQL): Promise<HeroBuild[]> {
  const adminId = await getAdminId();
  const builds = await db
    .select()
    .from(schema.heroBuilds)
    .where(
      and(where, buildReadFilter(await getAdminId(), await getViewerKey())),
    )
    .orderBy(asc(schema.heroBuilds.createdAt), asc(schema.heroBuilds.id));
  if (builds.length === 0) return [];
  const ids = builds.map((b) => b.id);

  const [runeRows, weaponRows, coreRows] = await Promise.all([
    db
      .select({
        buildId: schema.heroBuildRunes.buildId,
        rune: schema.runeAttributes,
        priority: schema.heroBuildRunes.priority,
      })
      .from(schema.heroBuildRunes)
      .innerJoin(
        schema.runeAttributes,
        eq(schema.heroBuildRunes.runeAttributeId, schema.runeAttributes.id),
      )
      .where(inArray(schema.heroBuildRunes.buildId, ids))
      .orderBy(
        asc(schema.heroBuildRunes.sortOrder),
        asc(schema.heroBuildRunes.id),
      ),
    db
      .select({
        buildId: schema.heroBuildWeapons.buildId,
        weapon: schema.weaponAttributes,
        priority: schema.heroBuildWeapons.priority,
      })
      .from(schema.heroBuildWeapons)
      .innerJoin(
        schema.weaponAttributes,
        eq(
          schema.heroBuildWeapons.weaponAttributeId,
          schema.weaponAttributes.id,
        ),
      )
      .where(inArray(schema.heroBuildWeapons.buildId, ids))
      .orderBy(
        asc(schema.heroBuildWeapons.sortOrder),
        asc(schema.heroBuildWeapons.id),
      ),
    db
      .select({
        buildId: schema.heroBuildCores.buildId,
        core: schema.heroCores,
        skill: schema.heroSkills,
        priority: schema.heroBuildCores.priority,
      })
      .from(schema.heroBuildCores)
      .innerJoin(
        schema.heroCores,
        eq(schema.heroBuildCores.coreId, schema.heroCores.id),
      )
      .innerJoin(
        schema.heroBuilds,
        and(
          eq(schema.heroBuildCores.buildId, schema.heroBuilds.id),
          eq(schema.heroCores.heroId, schema.heroBuilds.heroId),
        ),
      )
      .leftJoin(
        schema.heroSkills,
        and(
          eq(schema.heroCores.skillId, schema.heroSkills.id),
          eq(schema.heroCores.heroId, schema.heroSkills.heroId),
        ),
      )
      .where(inArray(schema.heroBuildCores.buildId, ids))
      .orderBy(
        asc(schema.heroBuildCores.sortOrder),
        asc(schema.heroBuildCores.id),
      ),
  ]);

  return builds.map(({ privateOwnerId, ...b }) => ({
    ...b,
    isPrivate: privateOwnerId !== null,
    canManage: Boolean(
      adminId && (!privateOwnerId || privateOwnerId === adminId),
    ),
    runes: runeRows
      .filter((r) => r.buildId === b.id)
      .map((r) => ({ ...r.rune, priority: r.priority })),
    weapons: weaponRows
      .filter((w) => w.buildId === b.id)
      .map((w) => ({ ...w.weapon, priority: w.priority })),
    cores: coreRows
      .filter((c) => c.buildId === b.id)
      .map((c) => ({ ...c.core, skill: c.skill, priority: c.priority })),
  }));
}

/**
 * Search other heroes' builds on demand. Fetch one extra row to detect another
 * page without counting or loading the entire build library.
 */
export async function getOtherHeroBuilds(
  excludeHeroId: number,
  query = "",
  page = 0,
): Promise<ImportableBuildPage> {
  const pageSize = 12;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const matches = terms.map((term) => {
    // Search literal text: SQL LIKE wildcards in a name aren't search operators.
    const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
    const translatedHeroes = matchingGameSlugs("hero", term);
    return or(
      ilike(schema.heroBuilds.name, pattern),
      ilike(schema.heroes.name, pattern),
      translatedHeroes.length
        ? inArray(schema.heroes.slug, translatedHeroes)
        : undefined,
    );
  });
  const rows = await db
    .select({
      id: schema.heroBuilds.id,
      name: schema.heroBuilds.name,
      heroName: schema.heroes.name,
      heroSlug: schema.heroes.slug,
    })
    .from(schema.heroBuilds)
    .innerJoin(schema.heroes, eq(schema.heroBuilds.heroId, schema.heroes.id))
    .where(
      and(
        ne(schema.heroBuilds.heroId, excludeHeroId),
        buildPrivacyFilter(await getAdminId()),
        ...matches,
      ),
    )
    .orderBy(
      asc(schema.heroes.name),
      asc(schema.heroes.id),
      asc(schema.heroBuilds.createdAt),
      asc(schema.heroBuilds.id),
    )
    .limit(pageSize + 1)
    .offset(page * pageSize);
  return {
    builds: rows.slice(0, pageSize),
    hasNextPage: rows.length > pageSize,
  };
}
