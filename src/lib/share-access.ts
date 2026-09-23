import "server-only";
import { eq, isNull, or, sql, type SQLWrapper } from "drizzle-orm";
import { db, schema } from "@/db";

/** A nickname is display text only; grants always use a stable authenticated identity. */
export function sharedWith(
  kind: string | SQLWrapper,
  id: SQLWrapper,
  key: string | null,
) {
  if (!key) return sql`false`;
  return sql`exists (select 1 from ${schema.contentShares} shared_content
    where shared_content.recipient_key = ${key}
      and ((${kind} = 'lineup' and shared_content.lineup_id = ${id})
        or (${kind} = 'build' and shared_content.build_id = ${id})))`;
}

export function contentReadFilter(
  kind: string | SQLWrapper,
  id: SQLWrapper,
  owner: SQLWrapper,
  adminId: string | null,
  key: string | null,
) {
  return or(
    isNull(owner),
    adminId ? eq(owner, adminId) : undefined,
    sharedWith(kind, id, key),
  )!;
}

/** Shared destinations supplement scoped IC access without granting the whole library. */
export async function sharedDestinations(
  key: string,
  database: Pick<typeof db, "select"> = db,
) {
  const rows = await database
    .select({
      lineupId: schema.contentShares.lineupId,
      heroSlug: schema.heroes.slug,
    })
    .from(schema.contentShares)
    .leftJoin(
      schema.heroBuilds,
      eq(schema.contentShares.buildId, schema.heroBuilds.id),
    )
    .leftJoin(schema.heroes, eq(schema.heroBuilds.heroId, schema.heroes.id))
    .where(eq(schema.contentShares.recipientKey, key));
  return {
    lineupIds: [
      ...new Set(
        rows.flatMap((r) => (r.lineupId === null ? [] : [r.lineupId])),
      ),
    ],
    heroSlugs: [
      ...new Set(
        rows.flatMap((r) => (r.heroSlug === null ? [] : [r.heroSlug])),
      ),
    ],
  };
}
