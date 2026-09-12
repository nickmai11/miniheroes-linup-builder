import "server-only";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { divinitySeeds } from "@/data/divinities";
import type { Divinity } from "@/db/schema";

/** Display order: same as the CATALOG in scripts/slice-divinities.py. */
const SEED_ORDER = new Map(divinitySeeds.map((d, i) => [d.slug, i]));

export function sortDivinities(list: Divinity[]): Divinity[] {
  return [...list].sort(
    (a, b) =>
      (SEED_ORDER.get(a.slug) ?? 999) - (SEED_ORDER.get(b.slug) ?? 999) ||
      a.name.localeCompare(b.name),
  );
}

/** Insert any seed divinities that aren't in the table yet. Safe to call repeatedly. */
export async function ensureDivinitiesSeeded() {
  await db
    .insert(schema.divinities)
    .values(divinitySeeds)
    .onConflictDoNothing({ target: schema.divinities.slug });
}

export async function getAllDivinities(): Promise<Divinity[]> {
  await ensureDivinitiesSeeded();
  const rows = await db
    .select()
    .from(schema.divinities)
    .orderBy(asc(schema.divinities.name));
  return sortDivinities(rows);
}
