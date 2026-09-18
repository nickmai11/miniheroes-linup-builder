import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import { getRegisteredDevice } from "@/lib/app-access";
import { isPublicPage } from "@/lib/public-urls";
import { lineupPrivacyFilter, visibleLineupFilter } from "@/lib/lineup-privacy";
import type { VoteSummary, VoteTarget, VoteValue } from "@/lib/vote-types";

/** Never trust the supplied page: verify both access and target membership. */
export async function getVoteAccess(target: VoteTarget) {
  const [adminId, device] = await Promise.all([
    getAdminId(),
    getRegisteredDevice(),
  ]);
  const voterKey = adminId
    ? `admin:${adminId}`
    : device
      ? `device:${device.id}`
      : null;
  const table = target.kind === "lineup" ? schema.lineups : schema.heroBuilds;
  const [exists] = await db
    .select({ id: table.id })
    .from(table)
    .where(
      and(
        eq(table.id, target.id),
        lineupPrivacyFilter(adminId, table.privateOwnerId),
      ),
    )
    .limit(1);
  if (!exists) return { allowed: false, voterKey: null };
  if (adminId || device?.fullAccess) return { allowed: true, voterKey };

  if (device?.lineupIds.length) {
    if (target.kind === "lineup" && device.lineupIds.includes(target.id))
      return { allowed: true, voterKey };
    if (target.kind === "build") {
      const [assigned] = await db
        .select({ id: schema.lineupHeroes.id })
        .from(schema.lineupHeroes)
        .where(
          and(
            eq(schema.lineupHeroes.buildId, target.id),
            inArray(schema.lineupHeroes.lineupId, device.lineupIds),
            visibleLineupFilter(schema.lineupHeroes.lineupId, adminId),
          ),
        )
        .limit(1);
      if (assigned) return { allowed: true, voterKey };
    }
  }

  const lineupMatch = target.page.match(/^\/lineups\/([1-9][0-9]*)$/);
  const heroMatch = target.page.match(/^\/heroes\/([a-z0-9-]+)$/);
  if (target.page !== "/lineups" && !lineupMatch && !heroMatch)
    return { allowed: false, voterKey: null };
  if (!(await isPublicPage(target.page)))
    return { allowed: false, voterKey: null };

  let allowed = false;
  if (target.kind === "lineup") {
    allowed =
      target.page === "/lineups" || Number(lineupMatch?.[1]) === target.id;
    if (heroMatch) {
      const [member] = await db
        .select({ id: schema.lineupHeroes.id })
        .from(schema.lineupHeroes)
        .innerJoin(
          schema.heroes,
          eq(schema.heroes.id, schema.lineupHeroes.heroId),
        )
        .where(
          and(
            eq(schema.lineupHeroes.lineupId, target.id),
            eq(schema.heroes.slug, heroMatch[1]),
          ),
        )
        .limit(1);
      allowed = Boolean(member);
    }
  } else if (heroMatch) {
    const [build] = await db
      .select({ id: schema.heroBuilds.id })
      .from(schema.heroBuilds)
      .innerJoin(schema.heroes, eq(schema.heroes.id, schema.heroBuilds.heroId))
      .where(
        and(
          eq(schema.heroBuilds.id, target.id),
          eq(schema.heroes.slug, heroMatch[1]),
        ),
      )
      .limit(1);
    allowed = Boolean(build);
  } else {
    const [assigned] = await db
      .select({ id: schema.lineupHeroes.id })
      .from(schema.lineupHeroes)
      .where(
        and(
          eq(schema.lineupHeroes.buildId, target.id),
          visibleLineupFilter(schema.lineupHeroes.lineupId, adminId),
          lineupMatch
            ? eq(schema.lineupHeroes.lineupId, Number(lineupMatch[1]))
            : undefined,
        ),
      )
      .limit(1);
    allowed = Boolean(assigned);
  }
  return { allowed, voterKey: allowed ? voterKey : null };
}

function targetColumn(target: VoteTarget) {
  return target.kind === "lineup"
    ? schema.contentVotes.lineupId
    : schema.contentVotes.buildId;
}

export async function getVoteSummary(
  target: VoteTarget,
  voterKey: string | null,
): Promise<VoteSummary> {
  const votes = schema.contentVotes;
  const [summary] = await db
    .select({
      likes: sql<number>`count(*) filter (where ${votes.value} = 1)`.mapWith(
        Number,
      ),
      dislikes:
        sql<number>`count(*) filter (where ${votes.value} = -1)`.mapWith(
          Number,
        ),
      vote: sql<number>`coalesce(max(${votes.value}) filter (where ${votes.voterKey} = ${voterKey}), 0)`.mapWith(
        Number,
      ),
    })
    .from(votes)
    .where(eq(targetColumn(target), target.id));
  return {
    ...summary,
    vote: summary.vote as VoteValue,
    canVote: voterKey !== null,
  };
}

/** Set the desired state so retries cannot toggle a vote twice. */
export async function setVote(
  target: VoteTarget,
  voterKey: string,
  value: VoteValue,
) {
  const votes = schema.contentVotes;
  const column = targetColumn(target);
  if (value === 0) {
    await db
      .delete(votes)
      .where(and(eq(column, target.id), eq(votes.voterKey, voterKey)));
  } else {
    await db
      .insert(votes)
      .values({
        lineupId: target.kind === "lineup" ? target.id : null,
        buildId: target.kind === "build" ? target.id : null,
        voterKey,
        value,
      })
      .onConflictDoUpdate({ target: [column, votes.voterKey], set: { value } });
  }
  return getVoteSummary(target, voterKey);
}
