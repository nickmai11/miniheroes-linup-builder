import "server-only";
import { and, desc, eq, lt, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { getRegisteredDevice, hasAppAccess } from "@/lib/app-access";
import type { ChangeKind, ChangePage } from "./change-types";
import { getFollowContext } from "@/lib/follows";
import { getAdminId } from "@/lib/admin-access";
import { lineupPrivacyFilter, visibleLineupFilter } from "@/lib/lineup-privacy";

/** Sharing the home or a hero page does not publish private lineup history. */
async function visibility() {
  const adminId = await getAdminId();
  const full = await hasAppAccess();
  const device = full ? null : await getRegisteredDevice();
  const invited = device?.lineupIds ?? [];
  const published = (path: SQL) =>
    sql`exists (select 1 from ${schema.publicUrls} p where p.path = ${path})`;
  const lineupAllowed = (
    id: SQL,
  ) => sql`(${visibleLineupFilter(id, adminId)} and (
    ${
      invited.length
        ? sql`${id} in (${sql.join(
            invited.map((id) => sql`${id}`),
            sql`, `,
          )})`
        : sql`false`
    }
    or ${published(sql`'/lineups'`)} or ${published(sql`'/lineups/' || ${id}`)}))`;
  const lineupHref = (id: SQL) => sql`case when ${full}
    or ${
      invited.length
        ? sql`${id} in (${sql.join(
            invited.map((id) => sql`${id}`),
            sql`, `,
          )})`
        : sql`false`
    }
    or ${published(sql`'/lineups/' || ${id}`)} then '/lineups/' || ${id} else '/lineups' end`;
  const buildAllowed = sql`(${published(sql`'/heroes/' || ${schema.heroes.slug}`)} or exists (
    select 1 from ${schema.lineupHeroes} a where a.build_id = ${schema.heroBuilds.id}
    and ${lineupAllowed(sql`a.lineup_id`)}))`;
  const audienceAllowed = full
    ? undefined
    : or(
        and(
          eq(schema.contentChanges.kind, "lineup"),
          sql`${schema.lineups.id} is not null`,
          lineupAllowed(sql`${schema.lineups.id}`),
        ),
        and(
          eq(schema.contentChanges.kind, "build"),
          sql`${schema.heroBuilds.id} is not null`,
          buildAllowed,
        ),
      );
  const href = sql<string | null>`case
    when ${schema.lineups.id} is not null then ${lineupHref(sql`${schema.lineups.id}`)}
    when ${schema.heroBuilds.id} is not null then case
      when ${full} or ${published(sql`'/heroes/' || ${schema.heroes.slug}`)} then '/heroes/' || ${schema.heroes.slug} || '#build-' || ${schema.heroBuilds.id}
      else (select ${lineupHref(sql`a.lineup_id`)} from ${schema.lineupHeroes} a
        where a.build_id = ${schema.heroBuilds.id} and ${lineupAllowed(sql`a.lineup_id`)} order by a.lineup_id limit 1)
      end
    else null end`;
  const allowed = and(
    audienceAllowed,
    lineupPrivacyFilter(adminId, schema.contentChanges.privateOwnerId),
    lineupPrivacyFilter(adminId),
  );
  return { allowed, href, full, invited, lineupAllowed, buildAllowed, adminId };
}

async function readChanges(
  where: SQL | undefined,
  limit: number,
): Promise<ChangePage> {
  const { allowed, href } = await visibility();
  const c = schema.contentChanges;
  const rows = await db
    .select({
      id: c.id,
      kind: c.kind,
      targetId: c.targetId,
      name: c.name,
      heroName: c.heroName,
      heroSlug: c.heroSlug,
      event: c.event,
      fields: c.fields,
      createdAt: c.createdAt,
      href,
    })
    .from(c)
    .leftJoin(
      schema.lineups,
      and(eq(c.kind, "lineup"), eq(c.targetId, schema.lineups.id)),
    )
    .leftJoin(
      schema.heroBuilds,
      and(eq(c.kind, "build"), eq(c.targetId, schema.heroBuilds.id)),
    )
    .leftJoin(schema.heroes, eq(schema.heroBuilds.heroId, schema.heroes.id))
    .where(and(where, allowed))
    .orderBy(desc(c.id))
    .limit(limit + 1);
  return {
    entries: rows.slice(0, limit),
    nextCursor: rows.length > limit ? rows[limit - 1].id : null,
  };
}

export async function getChangeHistory(
  kind: ChangeKind,
  id: number,
  before?: number,
): Promise<ChangePage | null> {
  const access = await visibility();
  // Verify the target even when it has no history yet. Never disclose tombstones via this API.
  const rows =
    kind === "lineup"
      ? await db
          .select({ id: schema.lineups.id })
          .from(schema.lineups)
          .where(
            and(
              eq(schema.lineups.id, id),
              lineupPrivacyFilter(access.adminId),
              access.full
                ? undefined
                : access.lineupAllowed(sql`${schema.lineups.id}`),
            ),
          )
      : await db
          .select({ id: schema.heroBuilds.id })
          .from(schema.heroBuilds)
          .innerJoin(
            schema.heroes,
            eq(schema.heroBuilds.heroId, schema.heroes.id),
          )
          .where(
            and(
              eq(schema.heroBuilds.id, id),
              access.full ? undefined : access.buildAllowed,
            ),
          );
  if (!rows.length) return null;
  return readChanges(
    and(
      eq(schema.contentChanges.kind, kind),
      eq(schema.contentChanges.targetId, id),
      before ? lt(schema.contentChanges.id, before) : undefined,
    ),
    20,
  );
}

export async function getRecentChanges(followingOnly = false) {
  if (!followingOnly) return (await readChanges(undefined, 10)).entries;
  const { key } = await getFollowContext();
  if (!key) return [];
  const c = schema.contentChanges;
  return (
    await readChanges(
      sql`exists (
    select 1 from ${schema.contentFollows} f where f.follower_key = ${key} and (
      (f.kind = 'lineup' and ${c.kind} = 'lineup' and f.target_id = ${c.targetId})
      or (f.kind = 'hero' and ${c.kind} = 'build' and exists (
        select 1 from ${schema.heroes} h where h.id = f.target_id and h.slug = ${c.heroSlug}))))`,
      10,
    )
  ).entries;
}
