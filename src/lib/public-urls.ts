import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { publicPagePath } from "@/lib/public-url-policy";

export const getPublicUrls = cache(async () =>
  db.select().from(schema.publicUrls).orderBy(asc(schema.publicUrls.path)),
);

// Request-scoped only: removals take effect on the very next request.
export const isPublicPage = cache(async (value: string): Promise<boolean> => {
  const path = publicPagePath(value);
  if (!path) return false;
  const [row] = await db
    .select({ id: schema.publicUrls.id })
    .from(schema.publicUrls)
    .where(eq(schema.publicUrls.path, path))
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
