import "server-only";
import { onceAsync } from "@/lib/once-async";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { runeAttributeSeeds } from "@/data/rune-attributes";
import { RUNE_TYPES, type RuneAttribute, type RuneType } from "@/db/schema";

/** Insert any seed rune attributes that aren't in the table yet. Safe to call repeatedly. */
export const ensureRuneAttributesSeeded = onceAsync(async () => {
  await db
    .insert(schema.runeAttributes)
    .values(runeAttributeSeeds)
    .onConflictDoNothing({ target: schema.runeAttributes.slug });
});

/** All rune attributes in rune-type order, then sheet order. */
export async function getAllRuneAttributes(): Promise<RuneAttribute[]> {
  await ensureRuneAttributesSeeded();
  const rows = await db
    .select()
    .from(schema.runeAttributes)
    .orderBy(asc(schema.runeAttributes.sortOrder));
  const typeOrder = new Map(RUNE_TYPES.map((t, i) => [t, i]));
  return rows.sort(
    (a, b) =>
      typeOrder.get(a.runeType)! - typeOrder.get(b.runeType)! ||
      a.sortOrder - b.sortOrder,
  );
}

/** Rune attributes grouped by type, in display order. */
export async function getRuneAttributesByType(): Promise<
  [RuneType, RuneAttribute[]][]
> {
  const all = await getAllRuneAttributes();
  return RUNE_TYPES.map((t) => [t, all.filter((a) => a.runeType === t)]);
}
