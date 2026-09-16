import "server-only";

import { eq, isNull, or, sql, type SQLWrapper } from "drizzle-orm";
import { schema } from "@/db";

/** Privacy is an additional restriction, even for invited viewers and admins. */
export function lineupPrivacyFilter(
  adminId: string | null,
  column: SQLWrapper = schema.lineups.privateOwnerId,
) {
  return or(isNull(column), adminId ? eq(column, adminId) : undefined)!;
}

/** Use for assignment queries without joining the lineup table. */
export function visibleLineupFilter(id: SQLWrapper, adminId: string | null) {
  return sql`exists (select 1 from ${schema.lineups} privacy_lineup
    where privacy_lineup.id = ${id} and
      (privacy_lineup.private_owner_id is null
       or privacy_lineup.private_owner_id = ${adminId}))`;
}
