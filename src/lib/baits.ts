import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { baitSeeds } from "@/data/baits";
import { onceAsync } from "@/lib/once-async";

export const ensureBaitsSeeded = onceAsync(async () => {
  await db
    .insert(schema.baits)
    .values(baitSeeds)
    .onConflictDoUpdate({
      target: schema.baits.slug,
      set: {
        name: sql`excluded.name`,
        iconUrl: sql`excluded.icon_url`,
        description: sql`excluded.description`,
        fishType: sql`excluded.fish_type`,
        bonuses: sql`excluded.bonuses`,
      },
    });
});
