import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import { getRegisteredDevice } from "@/lib/app-access";
import { getPublicUrls } from "@/lib/public-urls";
import { lineupReadFilter } from "@/lib/lineup-privacy";
import { lockContentWrites } from "@/lib/change-recording";
import type { FollowedItem, FollowSummary, FollowTarget } from "./follow-types";

export async function getFollowContext() {
  const [adminId, device] = await Promise.all([
    getAdminId(),
    getRegisteredDevice(),
  ]);
  return {
    adminId,
    key: adminId ? `admin:${adminId}` : device ? `device:${device.id}` : null,
    full: Boolean(adminId || device?.fullAccess),
    invited: device?.lineupIds ?? [],
    sharedHeroSlugs: device?.sharedHeroSlugs ?? [],
  };
}

async function accessContext() {
  const context = await getFollowContext();
  const paths = new Set(
    context.full ? [] : (await getPublicUrls()).map((row) => row.path),
  );
  function href(target: FollowTarget, slug: string | null) {
    if (target.kind === "lineup") {
      const path = `/lineups/${target.id}`;
      if (
        context.full ||
        context.invited.includes(target.id) ||
        paths.has(path)
      )
        return path;
      return paths.has("/lineups") ? "/lineups" : null;
    }
    const path = `/heroes/${slug}`;
    if (
      context.full ||
      paths.has(path) ||
      (slug && context.sharedHeroSlugs.includes(slug))
    )
      return path;
    return paths.has("/heroes") ? "/heroes" : null;
  }
  return { ...context, href };
}

function match(target: FollowTarget, key: string) {
  const f = schema.contentFollows;
  return and(
    eq(f.followerKey, key),
    eq(f.kind, target.kind),
    eq(f.targetId, target.id),
  );
}

export async function getFollowAccess(target: FollowTarget) {
  const context = await accessContext();
  const rows =
    target.kind === "lineup"
      ? await db
          .select({ id: schema.lineups.id })
          .from(schema.lineups)
          .where(
            and(
              eq(schema.lineups.id, target.id),
              lineupReadFilter(context.adminId, context.key),
            ),
          )
      : await db
          .select({ id: schema.heroes.id, slug: schema.heroes.slug })
          .from(schema.heroes)
          .where(eq(schema.heroes.id, target.id));
  const row = rows[0];
  return {
    key: context.key,
    allowed: Boolean(
      row && context.href(target, "slug" in row ? String(row.slug) : null),
    ),
  };
}

export async function getFollowSummary(
  target: FollowTarget,
  key: string | null,
  allowed: boolean,
): Promise<FollowSummary> {
  const rows = key
    ? await db
        .select({ id: schema.contentFollows.id })
        .from(schema.contentFollows)
        .where(match(target, key))
        .limit(1)
    : [];
  return { following: rows.length > 0, canFollow: Boolean(key && allowed) };
}

/** Set desired state: repeated requests never toggle or duplicate follows. */
export async function setFollow(
  target: FollowTarget,
  key: string,
  following: boolean,
) {
  await db.transaction(async (tx) => {
    // Serialize follow/unfollow with notification creation during a save.
    await lockContentWrites(tx);
    if (following)
      await tx
        .insert(schema.contentFollows)
        .values({ followerKey: key, kind: target.kind, targetId: target.id })
        .onConflictDoNothing();
    else await tx.delete(schema.contentFollows).where(match(target, key));
  });
}

export async function getFollowedItems(): Promise<FollowedItem[]> {
  const context = await accessContext();
  if (!context.key) return [];
  const f = schema.contentFollows;
  const rows = await db
    .select({
      kind: f.kind,
      id: f.targetId,
      lineupName: schema.lineups.name,
      heroName: schema.heroes.name,
      slug: schema.heroes.slug,
    })
    .from(f)
    .leftJoin(
      schema.lineups,
      and(
        eq(f.kind, "lineup"),
        eq(f.targetId, schema.lineups.id),
        lineupReadFilter(context.adminId, context.key),
      ),
    )
    .leftJoin(
      schema.heroes,
      and(eq(f.kind, "hero"), eq(f.targetId, schema.heroes.id)),
    )
    .where(eq(f.followerKey, context.key))
    .orderBy(desc(f.createdAt), desc(f.id));
  return rows.map((row) => {
    const name = row.kind === "lineup" ? row.lineupName : row.heroName;
    const href = name !== null ? context.href(row, row.slug) : null;
    return {
      kind: row.kind,
      id: row.id,
      available: Boolean(href),
      slug: href ? row.slug : null,
      href,
      name:
        href && name
          ? name
          : row.kind === "lineup"
            ? "Unavailable lineup"
            : "Unavailable hero",
    };
  });
}
