import "server-only";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Relic } from "@/db/schema";

/** Read the catalog imported by scripts/upsert-relics.sql. */
export const getAllRelics = cache(async (): Promise<Relic[]> => {
  return db.select().from(schema.relics).orderBy(asc(schema.relics.name));
});
