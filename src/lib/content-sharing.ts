import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import { getViewerKey } from "@/lib/viewer-profile";
import { lineupPrivacyFilter } from "@/lib/lineup-privacy";
import { lockContentWrites } from "@/lib/change-recording";
import { shareInputSchema, type ShareTarget } from "@/lib/share-input";

type Database = Pick<typeof db, "select">;
async function canManage(
  database: Database,
  target: ShareTarget,
  adminId: string,
) {
  const table = target.kind === "lineup" ? schema.lineups : schema.heroBuilds;
  const [row] = await database
    .select({ id: table.id, name: table.name })
    .from(table)
    .where(
      and(
        eq(table.id, target.id),
        lineupPrivacyFilter(adminId, table.privateOwnerId),
      ),
    );
  return row;
}
function targetFilter(target: ShareTarget) {
  return eq(
    target.kind === "lineup"
      ? schema.contentShares.lineupId
      : schema.contentShares.buildId,
    target.id,
  );
}
export async function getShareRecipients(target: ShareTarget) {
  const adminId = await getAdminId();
  if (!adminId || !(await canManage(db, target, adminId))) return null;
  const rows = await db
    .select({
      id: schema.viewerProfiles.id,
      nickname: schema.viewerProfiles.nickname,
      shareId: schema.contentShares.id,
    })
    .from(schema.viewerProfiles)
    .leftJoin(
      schema.contentShares,
      and(
        eq(schema.contentShares.recipientKey, schema.viewerProfiles.viewerKey),
        targetFilter(target),
      ),
    )
    .where(ne(schema.viewerProfiles.viewerKey, `admin:${adminId}`))
    .orderBy(
      asc(schema.viewerProfiles.nickname),
      asc(schema.viewerProfiles.id),
    );
  return rows.map(({ shareId, ...row }) => ({
    ...row,
    selected: shareId !== null,
  }));
}

export async function saveShareRecipients(input: unknown) {
  const adminId = await getAdminId();
  if (!adminId) return { error: "Sign in as admin to share.", status: 401 };
  const parsed = shareInputSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Invalid sharing request.", status: 400 };
  const target = parsed.data;
  const ids = [...new Set(target.recipientIds)];
  return db.transaction(async (tx) => {
    await lockContentWrites(tx);
    if (!(await canManage(tx, target, adminId)))
      return { error: "Not found.", status: 404 };
    const recipients = ids.length
      ? await tx
          .select({ key: schema.viewerProfiles.viewerKey })
          .from(schema.viewerProfiles)
          .where(
            and(
              inArray(schema.viewerProfiles.id, ids),
              ne(schema.viewerProfiles.viewerKey, `admin:${adminId}`),
            ),
          )
      : [];
    if (recipients.length !== ids.length)
      return {
        error: "Some nicknames are no longer available. Reload and try again.",
        status: 400,
      };
    await tx.delete(schema.contentShares).where(targetFilter(target));
    if (recipients.length)
      await tx.insert(schema.contentShares).values(
        recipients.map(({ key }) => ({
          recipientKey: key,
          lineupId: target.kind === "lineup" ? target.id : null,
          buildId: target.kind === "build" ? target.id : null,
        })),
      );
    return { saved: true, status: 200 };
  });
}

type SharedItem = {
  kind: "lineup" | "build";
  id: number;
  name: string;
  heroName: string | null;
  href: string;
};

export async function getSharedItems(): Promise<SharedItem[]> {
  const key = await getViewerKey();
  if (!key) return [];
  const rows = await db
    .select({
      lineupId: schema.lineups.id,
      lineupName: schema.lineups.name,
      buildId: schema.heroBuilds.id,
      buildName: schema.heroBuilds.name,
      heroName: schema.heroes.name,
      heroSlug: schema.heroes.slug,
    })
    .from(schema.contentShares)
    .leftJoin(
      schema.lineups,
      eq(schema.contentShares.lineupId, schema.lineups.id),
    )
    .leftJoin(
      schema.heroBuilds,
      eq(schema.contentShares.buildId, schema.heroBuilds.id),
    )
    .leftJoin(schema.heroes, eq(schema.heroBuilds.heroId, schema.heroes.id))
    .where(eq(schema.contentShares.recipientKey, key))
    .orderBy(asc(schema.contentShares.id));
  return rows.flatMap<SharedItem>((row) =>
    row.lineupId !== null
      ? [
          {
            kind: "lineup" as const,
            id: row.lineupId,
            name: row.lineupName!,
            heroName: null,
            href: `/lineups/${row.lineupId}`,
          },
        ]
      : row.buildId !== null
        ? [
            {
              kind: "build" as const,
              id: row.buildId,
              name: row.buildName!,
              heroName: row.heroName,
              href: `/heroes/${row.heroSlug}#build-${row.buildId}`,
            },
          ]
        : [],
  );
}
