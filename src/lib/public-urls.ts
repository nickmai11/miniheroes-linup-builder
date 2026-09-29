import "server-only";
import { cache } from "react";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { publicPageRules } from "@/lib/public-url-policy";

export const getPublicUrls = cache(async () =>
  db.select().from(schema.publicUrls).orderBy(asc(schema.publicUrls.path)),
);

// Request-scoped only: removals take effect on the very next request.
export const isPublicPage = cache(async (value: string): Promise<boolean> => {
  const rules = publicPageRules(value);
  if (!rules.length) return false;
  const [row] = await db
    .select({ id: schema.publicUrls.id })
    .from(schema.publicUrls)
    .where(inArray(schema.publicUrls.path, rules))
    .limit(1);
  return Boolean(row);
});

export async function addPublicUrl(path: string) {
  const [row] = await db
    .insert(schema.publicUrls)
    .values({ path })
    .onConflictDoNothing({ target: schema.publicUrls.path })
    .returning();
  return row;
}

export async function removePublicUrl(path: string) {
  await db.delete(schema.publicUrls).where(eq(schema.publicUrls.path, path));
}
