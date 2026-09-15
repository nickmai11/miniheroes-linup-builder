import "server-only";

import { desc, sql } from "drizzle-orm";
import { contentVotes, lineups } from "@/db/schema";

export type LineupSort = "date" | "likes";

/** Newest by default; ID keeps equal timestamps in a stable order. */
export function lineupOrder(sort: LineupSort = "date") {
  const newest = [desc(lineups.createdAt), desc(lineups.id)];
  if (sort === "date") return newest;

  const likes = sql`(select count(*) from ${contentVotes}
    where ${contentVotes.lineupId} = ${lineups.id}
      and ${contentVotes.value} = 1)`;
  return [desc(likes), ...newest];
}
