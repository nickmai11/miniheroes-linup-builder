import "server-only";
import { contentReadFilter, sharedWith } from "@/lib/share-access";

import { eq, isNull, or, sql, type SQLWrapper } from "drizzle-orm";
import { schema } from "@/db";

/** Ownership check for writes; read filters below also allow selected recipients. */
export function lineupPrivacyFilter(
  adminId: string | null,
  column: SQLWrapper = schema.lineups.privateOwnerId,
) {
  return or(isNull(column), adminId ? eq(column, adminId) : undefined)!;
}

/** Use for assignment queries without joining the lineup table. */
export function lineupReadFilter(adminId: string | null, key: string | null) {
  return contentReadFilter(
    "lineup",
    schema.lineups.id,
    schema.lineups.privateOwnerId,
    adminId,
    key,
  );
}

export function visibleLineupFilter(
  id: SQLWrapper,
  adminId: string | null,
  key: string | null = null,
) {
  return sql`exists (select 1 from ${schema.lineups} privacy_lineup
    where privacy_lineup.id = ${id} and
      (privacy_lineup.private_owner_id is null
       or privacy_lineup.private_owner_id = ${adminId}
       or ${sharedWith("lineup", id, key)}))`;
}
