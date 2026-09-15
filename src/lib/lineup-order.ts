import "server-only";

import { desc, sql } from "drizzle-orm";
import { contentVotes, lineups } from "@/db/schema";

/** Likes first, then newest; ID keeps equal timestamps in a stable order. */
export function lineupOrder() {
  const likes = sql`(select count(*) from ${contentVotes}
    where ${contentVotes.lineupId} = ${lineups.id}
      and ${contentVotes.value} = 1)`;
  return [desc(likes), desc(lineups.createdAt), desc(lineups.id)];
}
