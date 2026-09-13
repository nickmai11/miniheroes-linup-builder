import "server-only";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Fish } from "@/db/schema";
import { fishSeeds } from "@/data/fishes";
import { onceAsync } from "@/lib/once-async";

/** Insert missing fishes once per process; SQL imports refresh existing details. */
export const ensureFishesSeeded = onceAsync(async () => {
  await db
    .insert(schema.fishes)
    .values(fishSeeds)
    .onConflictDoNothing({ target: schema.fishes.slug });
});

export const getAllFishes = cache(async (): Promise<Fish[]> => {
  await ensureFishesSeeded();
  return db.select().from(schema.fishes).orderBy(asc(schema.fishes.name));
});
