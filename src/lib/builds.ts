import "server-only";
import { and, asc, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { HeroBuild, ImportableBuildPage } from "@/lib/build-types";

/**
 * A hero's builds, oldest first, each with its chosen rune attributes, weapon
 * attributes and cores in pick order, with each selection's saved priority tier.
 */
export async function getHeroBuilds(heroId: number): Promise<HeroBuild[]> {
  const builds = await db
    .select()
    .from(schema.heroBuilds)
    .where(eq(schema.heroBuilds.heroId, heroId))
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
        priority: schema.heroBuildCores.priority,
      })
      .from(schema.heroBuildCores)
      .innerJoin(
        schema.heroCores,
        eq(schema.heroBuildCores.coreId, schema.heroCores.id),
      )
      .where(
        and(
          inArray(schema.heroBuildCores.buildId, ids),
          eq(schema.heroCores.heroId, heroId),
        ),
      )
      .orderBy(
        asc(schema.heroBuildCores.sortOrder),
        asc(schema.heroBuildCores.id),
      ),
  ]);

  return builds.map((b) => ({
    ...b,
    runes: runeRows
      .filter((r) => r.buildId === b.id)
      .map((r) => ({ ...r.rune, priority: r.priority })),
    weapons: weaponRows
      .filter((w) => w.buildId === b.id)
      .map((w) => ({ ...w.weapon, priority: w.priority })),
    cores: coreRows
      .filter((c) => c.buildId === b.id)
      .map((c) => ({ ...c.core, priority: c.priority })),
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
    return or(
      ilike(schema.heroBuilds.name, pattern),
      ilike(schema.heroes.name, pattern),
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
    .where(and(ne(schema.heroBuilds.heroId, excludeHeroId), ...matches))
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
