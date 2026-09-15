import "server-only";
import { cache } from "react";
import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Fish } from "@/db/schema";
import { fishSeeds } from "@/data/fishes";
import { onceAsync } from "@/lib/once-async";
import { ensureBaitsSeeded } from "@/lib/baits";

/** Refresh the source catalog once per process, keeping IDs and lineup links. */
export const ensureFishesSeeded = onceAsync(async () => {
  await ensureBaitsSeeded();
  await db
    .insert(schema.fishes)
    .values(fishSeeds)
    .onConflictDoUpdate({
      target: schema.fishes.slug,
      set: {
        name: sql`excluded.name`,
        iconUrl: sql`excluded.icon_url`,
        rarity: sql`excluded.rarity`,
        area: sql`excluded.area`,
        fishType: sql`excluded.fish_type`,
        collection: sql`excluded.collection`,
        stats: sql`excluded.stats`,
        baseStats: sql`excluded.base_stats`,
        specialStats: sql`excluded.special_stats`,
        bait: sql`excluded.bait`,
      },
    });
});

export const getAllFishes = cache(async (): Promise<Fish[]> => {
  await ensureFishesSeeded();
  return db.select().from(schema.fishes).orderBy(asc(schema.fishes.name));
});
