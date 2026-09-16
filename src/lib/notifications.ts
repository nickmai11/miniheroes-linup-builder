import "server-only";

import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db, schema } from "@/db";
import { getFollowContext } from "@/lib/follows";
import { lineupPrivacyFilter } from "@/lib/lineup-privacy";
import type {
  NotificationPage,
  NotificationRead,
} from "@/lib/notification-types";

const n = schema.lineupNotifications;
const f = schema.contentFollows;
const c = schema.contentChanges;
const l = schema.lineups;

async function access() {
  const context = await getFollowContext();
  if (!context.key) return null;
  const published = (path: SQL) => sql`exists (
    select 1 from ${schema.publicUrls} p where p.path = ${path})`;
  const direct = or(
    context.full ? sql`true` : sql`false`,
    context.invited.length ? inArray(l.id, context.invited) : undefined,
    published(sql`'/lineups/' || ${l.id}`),
  )!;
  return {
    where: and(
      eq(f.followerKey, context.key),
      eq(f.kind, "lineup"),
      eq(c.kind, "lineup"),
      eq(c.event, "updated"),
      lineupPrivacyFilter(context.adminId),
      lineupPrivacyFilter(context.adminId, c.privateOwnerId),
      or(direct, published(sql`'/lineups'`)),
    ),
    href: sql<string>`case when ${direct} then '/lineups/' || ${l.id} else '/lineups' end`,
  };
}

function joined() {
  return db
    .select({ id: n.id })
    .from(n)
    .innerJoin(f, eq(n.followId, f.id))
    .innerJoin(c, eq(n.changeId, c.id))
    .innerJoin(l, and(eq(l.id, f.targetId), eq(l.id, c.targetId)));
}

export async function getNotifications(
  before?: number,
): Promise<NotificationPage | null> {
  const scope = await access();
  if (!scope) return null;
  const [summary] = await db
    .select({
      unreadCount:
        sql<number>`count(*) filter (where ${n.readAt} is null)`.mapWith(
          Number,
        ),
      latestId: sql<number | null>`max(${n.id})`,
    })
    .from(n)
    .innerJoin(f, eq(n.followId, f.id))
    .innerJoin(c, eq(n.changeId, c.id))
    .innerJoin(l, and(eq(l.id, f.targetId), eq(l.id, c.targetId)))
    .where(scope.where);
  const rows =
    summary.latestId === null
      ? []
      : await db
          .select({
            id: n.id,
            lineupId: l.id,
            name: l.name,
            href: scope.href,
            createdAt: c.createdAt,
            readAt: n.readAt,
            fields: c.fields,
          })
          .from(n)
          .innerJoin(f, eq(n.followId, f.id))
          .innerJoin(c, eq(n.changeId, c.id))
          .innerJoin(l, and(eq(l.id, f.targetId), eq(l.id, c.targetId)))
          .where(
            and(
              scope.where,
              lte(n.id, summary.latestId),
              before ? lt(n.id, before) : undefined,
            ),
          )
          .orderBy(desc(n.id))
          .limit(21);
  return {
    ...summary,
    items: rows.slice(0, 20).map(({ readAt, fields, ...row }) => ({
      ...row,
      read: readAt !== null,
      fields: fields.map((field) => field.label),
    })),
    nextCursor: rows.length > 20 ? rows[19].id : null,
  };
}

export async function markNotificationsRead(
  input: NotificationRead,
): Promise<boolean> {
  const scope = await access();
  if (!scope) return false;
  // The subquery checks both ownership and current content visibility. A bounded
  // cursor leaves updates arriving after the user's snapshot unread.
  const ids = joined().where(
    and(
      scope.where,
      "id" in input ? eq(n.id, input.id) : lte(n.id, input.throughId),
    ),
  );
  await db
    .update(n)
    .set({ readAt: sql`now()` })
    .where(and(isNull(n.readAt), inArray(n.id, ids)));
  return true;
}
