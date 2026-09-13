"use server";

import { requireAppAccess } from "@/lib/app-access";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { matchBuildCores } from "@/lib/build-cores";
import { buildSchema, type BuildInput } from "@/lib/build-input";
import { DEFAULT_BUILD_PRIORITY } from "@/lib/build-priorities";
import { canEditLocally, LOCAL_EDITING_ERROR } from "@/lib/local-editing";

export type BuildActionState = { error?: string; id?: number; notice?: string };
export type { BuildInput } from "@/lib/build-input";

async function allKnown(
  ids: number[],
  table: typeof schema.runeAttributes | typeof schema.weaponAttributes,
) {
  if (ids.length === 0) return true;
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(inArray(table.id, ids));
  return rows.length === new Set(ids).size;
}

export async function saveHeroBuild(
  input: BuildInput,
): Promise<BuildActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  await requireAppAccess();
  const parsed = buildSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid build" };
  }
  const { id, heroId, name, notes } = parsed.data;
  const runeIds = [...new Set(parsed.data.runeAttributeIds)];
  const weaponIds = [...new Set(parsed.data.weaponAttributeIds)];
  const coreIds = [...new Set(parsed.data.coreIds)];

  const [hero] = await db
    .select({ slug: schema.heroes.slug })
    .from(schema.heroes)
    .where(eq(schema.heroes.id, heroId));
  if (!hero) return { error: "Hero not found" };
  if (!(await allKnown(runeIds, schema.runeAttributes)))
    return { error: "One of the rune attributes no longer exists" };
  if (!(await allKnown(weaponIds, schema.weaponAttributes)))
    return { error: "One of the weapon attributes no longer exists" };
  if (coreIds.length > 0) {
    const cores = await db
      .select({ id: schema.heroCores.id })
      .from(schema.heroCores)
      .where(
        and(
          eq(schema.heroCores.heroId, heroId),
          inArray(schema.heroCores.id, coreIds),
        ),
      );
    if (cores.length !== coreIds.length)
      return {
        error:
          "Choose cores recorded for this hero. Refresh the page if a core has changed.",
      };
  }

  const buildId = await db.transaction(async (tx) => {
    let buildId = id;
    if (buildId) {
      const updated = await tx
        .update(schema.heroBuilds)
        .set({ name, notes })
        .where(
          and(
            eq(schema.heroBuilds.id, buildId),
            eq(schema.heroBuilds.heroId, heroId),
          ),
        )
        .returning({
          id: schema.heroBuilds.id,
          heroId: schema.heroBuilds.heroId,
        });
      if (updated.length === 0 || updated[0].heroId !== heroId) return null;
      await tx
        .delete(schema.heroBuildRunes)
        .where(eq(schema.heroBuildRunes.buildId, buildId));
      await tx
        .delete(schema.heroBuildWeapons)
        .where(eq(schema.heroBuildWeapons.buildId, buildId));
      await tx
        .delete(schema.heroBuildCores)
        .where(eq(schema.heroBuildCores.buildId, buildId));
    } else {
      const [row] = await tx
        .insert(schema.heroBuilds)
        .values({ heroId, name, notes })
        .returning({ id: schema.heroBuilds.id });
      buildId = row.id;
    }
    // Preserve pick order within the independently selected priority tiers.
    if (runeIds.length > 0)
      await tx.insert(schema.heroBuildRunes).values(
        runeIds.map((runeAttributeId, sortOrder) => ({
          buildId,
          runeAttributeId,
          sortOrder,
          priority:
            parsed.data.runePriorities[runeAttributeId] ??
            DEFAULT_BUILD_PRIORITY,
        })),
      );
    if (weaponIds.length > 0)
      await tx.insert(schema.heroBuildWeapons).values(
        weaponIds.map((weaponAttributeId, sortOrder) => ({
          buildId,
          weaponAttributeId,
          sortOrder,
          priority:
            parsed.data.weaponPriorities[weaponAttributeId] ??
            DEFAULT_BUILD_PRIORITY,
        })),
      );
    if (coreIds.length > 0)
      await tx.insert(schema.heroBuildCores).values(
        coreIds.map((coreId, sortOrder) => ({
          buildId,
          coreId,
          sortOrder,
          priority:
            parsed.data.corePriorities[coreId] ?? DEFAULT_BUILD_PRIORITY,
        })),
      );
    return buildId;
  });
  if (buildId === null) return { error: "Build not found" };

  revalidatePath(`/heroes/${hero.slug}`);
  revalidatePath("/lineups", "layout");
  return { id: buildId };
}

const importSchema = z.object({
  heroId: z.number().int().positive(),
  sourceBuildId: z.number().int().positive(),
});

export type ImportBuildInput = z.input<typeof importSchema>;

/** Copy a build and map its cores by gear name to this hero's own bonuses. */
export async function importHeroBuild(
  input: ImportBuildInput,
): Promise<BuildActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  await requireAppAccess();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { heroId, sourceBuildId } = parsed.data;

  const [hero] = await db
    .select({ slug: schema.heroes.slug })
    .from(schema.heroes)
    .where(eq(schema.heroes.id, heroId));
  if (!hero) return { error: "Hero not found" };

  const [source] = await db
    .select()
    .from(schema.heroBuilds)
    .where(eq(schema.heroBuilds.id, sourceBuildId));
  if (!source) return { error: "That build no longer exists" };
  if (source.heroId === heroId)
    return { error: "That build already belongs to this hero" };

  const [runeRows, weaponRows, coreRows, targetCores] = await Promise.all([
    db
      .select({
        runeAttributeId: schema.heroBuildRunes.runeAttributeId,
        priority: schema.heroBuildRunes.priority,
      })
      .from(schema.heroBuildRunes)
      .where(eq(schema.heroBuildRunes.buildId, sourceBuildId))
      .orderBy(
        asc(schema.heroBuildRunes.sortOrder),
        asc(schema.heroBuildRunes.id),
      ),
    db
      .select({
        weaponAttributeId: schema.heroBuildWeapons.weaponAttributeId,
        priority: schema.heroBuildWeapons.priority,
      })
      .from(schema.heroBuildWeapons)
      .where(eq(schema.heroBuildWeapons.buildId, sourceBuildId))
      .orderBy(
        asc(schema.heroBuildWeapons.sortOrder),
        asc(schema.heroBuildWeapons.id),
      ),
    db
      .select({
        name: schema.heroCores.name,
        priority: schema.heroBuildCores.priority,
      })
      .from(schema.heroBuildCores)
      .innerJoin(
        schema.heroCores,
        eq(schema.heroBuildCores.coreId, schema.heroCores.id),
      )
      .where(
        and(
          eq(schema.heroBuildCores.buildId, sourceBuildId),
          eq(schema.heroCores.heroId, source.heroId),
        ),
      )
      .orderBy(
        asc(schema.heroBuildCores.sortOrder),
        asc(schema.heroBuildCores.id),
      ),
    db
      .select({ id: schema.heroCores.id, name: schema.heroCores.name })
      .from(schema.heroCores)
      .where(eq(schema.heroCores.heroId, heroId)),
  ]);
  const { coreIds, skippedCoreNames } = matchBuildCores(coreRows, targetCores);
  const corePriorities = new Map(
    targetCores.map((core) => [
      core.id,
      coreRows.find((sourceCore) => sourceCore.name === core.name)?.priority ??
        DEFAULT_BUILD_PRIORITY,
    ]),
  );
  if (runeRows.length + weaponRows.length + coreIds.length === 0)
    return {
      error:
        "This build has no rune or weapon attributes, and none of its cores are recorded for this hero.",
    };

  const newId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.heroBuilds)
      .values({ heroId, name: source.name, notes: source.notes })
      .returning({ id: schema.heroBuilds.id });
    if (runeRows.length > 0)
      await tx.insert(schema.heroBuildRunes).values(
        runeRows.map((r, sortOrder) => ({
          buildId: row.id,
          runeAttributeId: r.runeAttributeId,
          priority: r.priority,
          sortOrder,
        })),
      );
    if (weaponRows.length > 0)
      await tx.insert(schema.heroBuildWeapons).values(
        weaponRows.map((w, sortOrder) => ({
          buildId: row.id,
          weaponAttributeId: w.weaponAttributeId,
          priority: w.priority,
          sortOrder,
        })),
      );
    if (coreIds.length > 0)
      await tx.insert(schema.heroBuildCores).values(
        coreIds.map((coreId, sortOrder) => ({
          buildId: row.id,
          coreId,
          sortOrder,
          priority: corePriorities.get(coreId) ?? DEFAULT_BUILD_PRIORITY,
        })),
      );
    return row.id;
  });

  revalidatePath(`/heroes/${hero.slug}`);
  revalidatePath("/lineups", "layout");
  return {
    id: newId,
    notice:
      skippedCoreNames.length > 0
        ? `Build imported. Cores not recorded for this hero were skipped: ${skippedCoreNames.join(", ")}.`
        : undefined,
  };
}

export async function deleteHeroBuild(id: number): Promise<BuildActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  await requireAppAccess();
  const [deleted] = await db
    .delete(schema.heroBuilds)
    .where(eq(schema.heroBuilds.id, id))
    .returning({ heroId: schema.heroBuilds.heroId });
  if (!deleted) return { error: "Build not found" };
  const [hero] = await db
    .select({ slug: schema.heroes.slug })
    .from(schema.heroes)
    .where(eq(schema.heroes.id, deleted.heroId));
  if (hero) revalidatePath(`/heroes/${hero.slug}`);
  revalidatePath("/lineups", "layout");
  return {};
}
