import "server-only";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Pet } from "@/db/schema";
import { petSeeds } from "@/data/pets";
import { onceAsync } from "@/lib/once-async";

/** Insert missing catalog pets once per process; failed attempts can retry. */
export const ensurePetsSeeded = onceAsync(async () => {
  await db
    .insert(schema.pets)
    .values(petSeeds)
    .onConflictDoNothing({ target: schema.pets.slug });
});

export const getAllPets = cache(async (): Promise<Pet[]> => {
  await ensurePetsSeeded();
  return db.select().from(schema.pets).orderBy(asc(schema.pets.name));
});
