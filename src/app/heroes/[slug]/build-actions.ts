"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";

export type BuildActionState = { error?: string; id?: number };

const idList = z.array(z.number().int().positive()).max(200);

const buildSchema = z
  .object({
    // Present when editing an existing build.
    id: z.number().int().positive().optional(),
    heroId: z.number().int().positive(),
    name: z.string().trim().min(1, "Give the build a name").max(120),
    notes: z.string().trim().max(5000).default(""),
    runeAttributeIds: idList,
    weaponAttributeIds: idList,
  })
  .refine(
    (b) => b.runeAttributeIds.length + b.weaponAttributeIds.length > 0,
    "Pick at least one rune or weapon attribute",
  );

export type BuildInput = z.input<typeof buildSchema>;

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
  const parsed = buildSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid build" };
  }
  const { id, heroId, name, notes } = parsed.data;
  const runeIds = [...new Set(parsed.data.runeAttributeIds)];
  const weaponIds = [...new Set(parsed.data.weaponAttributeIds)];

  const [hero] = await db
    .select({ slug: schema.heroes.slug })
    .from(schema.heroes)
    .where(eq(schema.heroes.id, heroId));
  if (!hero) return { error: "Hero not found" };
  if (!(await allKnown(runeIds, schema.runeAttributes)))
    return { error: "One of the rune attributes no longer exists" };
  if (!(await allKnown(weaponIds, schema.weaponAttributes)))
    return { error: "One of the weapon attributes no longer exists" };

  const buildId = await db.transaction(async (tx) => {
    let buildId = id;
    if (buildId) {
      const updated = await tx
        .update(schema.heroBuilds)
        .set({ name, notes })
        .where(eq(schema.heroBuilds.id, buildId))
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
    } else {
      const [row] = await tx
        .insert(schema.heroBuilds)
        .values({ heroId, name, notes })
        .returning({ id: schema.heroBuilds.id });
      buildId = row.id;
    }
    // Array order = the order the owner picked them = priority.
    if (runeIds.length > 0)
      await tx.insert(schema.heroBuildRunes).values(
        runeIds.map((runeAttributeId, sortOrder) => ({
          buildId,
          runeAttributeId,
          sortOrder,
        })),
      );
    if (weaponIds.length > 0)
      await tx.insert(schema.heroBuildWeapons).values(
        weaponIds.map((weaponAttributeId, sortOrder) => ({
          buildId,
          weaponAttributeId,
          sortOrder,
        })),
      );
    return buildId;
  });
  if (buildId === null) return { error: "Build not found" };

  revalidatePath(`/heroes/${hero.slug}`);
  return { id: buildId };
}

const importSchema = z.object({
  heroId: z.number().int().positive(),
  sourceBuildId: z.number().int().positive(),
});

export type ImportBuildInput = z.input<typeof importSchema>;

/** Copy another hero's build (name, notes, runes, weapons) onto this hero. */
export async function importHeroBuild(
  input: ImportBuildInput,
): Promise<BuildActionState> {
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

  const [runeRows, weaponRows] = await Promise.all([
    db
      .select({ runeAttributeId: schema.heroBuildRunes.runeAttributeId })
      .from(schema.heroBuildRunes)
      .where(eq(schema.heroBuildRunes.buildId, sourceBuildId))
      .orderBy(
        asc(schema.heroBuildRunes.sortOrder),
        asc(schema.heroBuildRunes.id),
      ),
    db
      .select({ weaponAttributeId: schema.heroBuildWeapons.weaponAttributeId })
      .from(schema.heroBuildWeapons)
      .where(eq(schema.heroBuildWeapons.buildId, sourceBuildId))
      .orderBy(
        asc(schema.heroBuildWeapons.sortOrder),
        asc(schema.heroBuildWeapons.id),
      ),
  ]);

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
          sortOrder,
        })),
      );
    if (weaponRows.length > 0)
      await tx.insert(schema.heroBuildWeapons).values(
        weaponRows.map((w, sortOrder) => ({
          buildId: row.id,
          weaponAttributeId: w.weaponAttributeId,
          sortOrder,
        })),
      );
    return row.id;
  });

  revalidatePath(`/heroes/${hero.slug}`);
  return { id: newId };
}

export async function deleteHeroBuild(id: number): Promise<BuildActionState> {
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
  return {};
}
