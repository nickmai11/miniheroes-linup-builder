import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { HeroBuild } from "@/lib/build-types";
import { RUNE_TYPES } from "@/db/schema";

/** A hero's builds, oldest first, each with its chosen rune and weapon attributes. */
export async function getHeroBuilds(heroId: number): Promise<HeroBuild[]> {
  const builds = await db
    .select()
    .from(schema.heroBuilds)
    .where(eq(schema.heroBuilds.heroId, heroId))
    .orderBy(asc(schema.heroBuilds.createdAt), asc(schema.heroBuilds.id));
  if (builds.length === 0) return [];
  const ids = builds.map((b) => b.id);

  const [runeRows, weaponRows] = await Promise.all([
    db
      .select({
        buildId: schema.heroBuildRunes.buildId,
        rune: schema.runeAttributes,
      })
      .from(schema.heroBuildRunes)
      .innerJoin(
        schema.runeAttributes,
        eq(schema.heroBuildRunes.runeAttributeId, schema.runeAttributes.id),
      )
      .where(inArray(schema.heroBuildRunes.buildId, ids)),
    db
      .select({
        buildId: schema.heroBuildWeapons.buildId,
        weapon: schema.weaponAttributes,
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
      .orderBy(asc(schema.weaponAttributes.sortOrder)),
  ]);

  const typeOrder = new Map(RUNE_TYPES.map((t, i) => [t, i]));
  return builds.map((b) => ({
    ...b,
    runes: runeRows
      .filter((r) => r.buildId === b.id)
      .map((r) => r.rune)
      .sort(
        (a, c) =>
          typeOrder.get(a.runeType)! - typeOrder.get(c.runeType)! ||
          a.sortOrder - c.sortOrder,
      ),
    weapons: weaponRows.filter((w) => w.buildId === b.id).map((w) => w.weapon),
  }));
}
