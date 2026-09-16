import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import { visibleLineupFilter } from "@/lib/lineup-privacy";

/** Only lineups listed for this hero and independently readable by the visitor. */
export async function heroLineupPreviewIds(
  heroSlug: string,
  invitedLineupIds: number[] = [],
  fullAccess = false,
): Promise<number[]> {
  const rows = await db
    .selectDistinct({ id: schema.lineupHeroes.lineupId })
    .from(schema.lineupHeroes)
    .innerJoin(schema.heroes, eq(schema.heroes.id, schema.lineupHeroes.heroId))
    .where(
      and(
        eq(schema.heroes.slug, heroSlug),
        visibleLineupFilter(schema.lineupHeroes.lineupId, await getAdminId()),
      ),
    );
  const ids = rows.map((row) => row.id);
  if (fullAccess || !ids.length) return ids;
  const published = await db
    .select({ path: schema.publicUrls.path })
    .from(schema.publicUrls)
    .where(
      inArray(schema.publicUrls.path, [
        "/lineups",
        ...ids.map((id) => `/lineups/${id}`),
      ]),
    );
  const paths = new Set(published.map((row) => row.path));
  if (paths.has("/lineups")) return ids;
  return ids.filter(
    (id) => invitedLineupIds.includes(id) || paths.has(`/lineups/${id}`),
  );
}
