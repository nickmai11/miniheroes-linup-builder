import "server-only";
import { onceAsync } from "@/lib/once-async";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { weaponAttributeSeeds } from "@/data/weapon-attributes";
import type { WeaponAttribute } from "@/db/schema";

/** Insert any seed weapon attributes that aren't in the table yet. Safe to call repeatedly. */
export const ensureWeaponAttributesSeeded = onceAsync(async () => {
  await db
    .insert(schema.weaponAttributes)
    .values(weaponAttributeSeeds)
    .onConflictDoNothing({ target: schema.weaponAttributes.slug });
});

/** All weapon attributes in catalog order. */
export async function getAllWeaponAttributes(): Promise<WeaponAttribute[]> {
  await ensureWeaponAttributesSeeded();
  return db
    .select()
    .from(schema.weaponAttributes)
    .orderBy(asc(schema.weaponAttributes.sortOrder));
}
