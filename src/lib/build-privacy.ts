import "server-only";
import { contentReadFilter, sharedWith } from "@/lib/share-access";

import { sql } from "drizzle-orm";
import { schema } from "@/db";
import { lineupPrivacyFilter } from "@/lib/lineup-privacy";

/** Builds have the same owner-only privacy as lineups, including in assignments. */
export function buildPrivacyFilter(adminId: string | null) {
  return lineupPrivacyFilter(adminId, schema.heroBuilds.privateOwnerId);
}

export function buildReadFilter(adminId: string | null, key: string | null) {
  return contentReadFilter(
    "build",
    schema.heroBuilds.id,
    schema.heroBuilds.privateOwnerId,
    adminId,
    key,
  );
}

/** Lineup history can name previously assigned builds, even after removal/deletion. */
export function buildHistoryPrivacyFilter(
  adminId: string | null,
  key: string | null = null,
) {
  return sql`not exists (
    select 1 from ${schema.heroBuilds} private_build
    where private_build.id = any(${schema.contentChanges.buildIds})
      and private_build.private_owner_id is not null
      and private_build.private_owner_id is distinct from ${adminId}
      and not ${sharedWith("build", sql`private_build.id`, key)}
  ) and not exists (
    select 1 from ${schema.contentChanges} private_build_history
    where private_build_history.kind = 'build'
      and private_build_history.target_id = any(${schema.contentChanges.buildIds})
      and private_build_history.private_owner_id is not null
      and private_build_history.private_owner_id is distinct from ${adminId}
      and not ${sharedWith("build", sql`private_build_history.target_id`, key)}
  )`;
}
