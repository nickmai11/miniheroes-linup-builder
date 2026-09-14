import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { heroSeeds } from "@/data/heroes";
import { heroDetailSeeds } from "@/data/hero-details";
import { divinitySeeds } from "@/data/divinities";

const SHARED_ICONS = new Set([
  "/icons/core.png",
  ...["purple", "gold", "red", "rainbow"].map(
    (tier) => `/icons/artifact-${tier}.png`,
  ),
]);

function heroAssets(
  slug: string,
  details: boolean,
  divinities: boolean,
): Set<string> {
  const assets = new Set<string>();
  const hero = heroSeeds.find((item) => item.slug === slug);
  if (!hero) return assets;
  if (hero.imageUrl) assets.add(hero.imageUrl);
  assets.add(`/badges/${hero.role}.png`);
  const seed = heroDetailSeeds[slug];
  if (divinities)
    for (const name of seed?.divinities ?? []) {
      const divinity = divinitySeeds.find((item) => item.slug === name);
      if (divinity) assets.add(divinity.iconUrl);
    }
  if (details) {
    for (const skill of seed?.skills ?? [])
      if (skill.iconUrl) assets.add(skill.iconUrl);
    if (seed?.artifact?.iconUrl) assets.add(seed.artifact.iconUrl);
    for (const icon of SHARED_ICONS) assets.add(icon);
  }
  return assets;
}

/** Artwork belonging to a published or invited page, optionally restricted by device. */
export async function isPublicPageAsset(
  page: string,
  asset: string,
  allowedLineupIds?: number[],
): Promise<boolean> {
  if (
    !/^\/(heroes|badges|divinities|talents|artifacts|icons|pets|relics|fishes)\/[a-z0-9/-]+\.png$/.test(
      asset,
    )
  )
    return false;
  if (page === "/heroes") {
    return Object.keys(heroDetailSeeds).some((slug) =>
      heroAssets(slug, false, true).has(asset),
    );
  }
  const hero = page.match(/^\/heroes\/([a-z0-9-]+)$/);
  if (hero) return heroAssets(hero[1], true, true).has(asset);
  if (page === "/divinities")
    return divinitySeeds.some((item) => item.iconUrl === asset);
  const divinity = page.match(/^\/divinities\/([a-z0-9-]+)$/);
  if (divinity) {
    if (
      divinitySeeds.some(
        (item) => item.slug === divinity[1] && item.iconUrl === asset,
      )
    )
      return true;
    return Object.entries(heroDetailSeeds).some(
      ([slug, seed]) =>
        seed.divinities.includes(divinity[1]) &&
        heroAssets(slug, false, true).has(asset),
    );
  }
  const lineup = page.match(/^\/lineups(?:\/([1-9][0-9]*))?$/);
  if (!lineup) return false;
  const lineupId = lineup[1] ? Number(lineup[1]) : null;
  if (
    allowedLineupIds &&
    (allowedLineupIds.length === 0 ||
      (lineupId !== null && !allowedLineupIds.includes(lineupId)))
  )
    return false;
  const lineupFilter = (
    column:
      typeof schema.lineupHeroes.lineupId | typeof schema.lineupFishes.lineupId,
  ) =>
    lineupId !== null
      ? eq(column, lineupId)
      : allowedLineupIds
        ? inArray(column, allowedLineupIds)
        : undefined;
  if (
    lineupId !== null &&
    (!Number.isSafeInteger(lineupId) || lineupId > 2147483647)
  )
    return false;

  // Query only the relevant assignment type. Assets do not load full lineups or
  // synchronize hero seeds, and a removed public URL is rechecked by Proxy first.
  if (asset.startsWith("/pets/")) {
    const rows = await db
      .select({ iconUrl: schema.pets.iconUrl })
      .from(schema.lineupHeroPets)
      .innerJoin(schema.pets, eq(schema.lineupHeroPets.petId, schema.pets.id))
      .innerJoin(
        schema.lineupHeroes,
        eq(schema.lineupHeroPets.lineupHeroId, schema.lineupHeroes.id),
      )
      .where(lineupFilter(schema.lineupHeroes.lineupId));
    return rows.some((row) => row.iconUrl === asset);
  }
  if (asset.startsWith("/relics/")) {
    const rows = await db
      .select({ iconUrl: schema.relics.iconUrl })
      .from(schema.lineupHeroRelics)
      .innerJoin(
        schema.relics,
        eq(schema.lineupHeroRelics.relicId, schema.relics.id),
      )
      .innerJoin(
        schema.lineupHeroes,
        eq(schema.lineupHeroRelics.lineupHeroId, schema.lineupHeroes.id),
      )
      .where(lineupFilter(schema.lineupHeroes.lineupId));
    return rows.some((row) => row.iconUrl === asset);
  }
  if (asset.startsWith("/fishes/")) {
    const rows = await db
      .select({ iconUrl: schema.fishes.iconUrl })
      .from(schema.lineupFishes)
      .innerJoin(
        schema.fishes,
        eq(schema.lineupFishes.fishId, schema.fishes.id),
      )
      .where(lineupFilter(schema.lineupFishes.lineupId));
    return rows.some((row) => row.iconUrl === asset);
  }
  const heroes = await db
    .selectDistinct({ slug: schema.heroes.slug })
    .from(schema.lineupHeroes)
    .innerJoin(schema.heroes, eq(schema.lineupHeroes.heroId, schema.heroes.id))
    .where(lineupFilter(schema.lineupHeroes.lineupId));
  return heroes.some(({ slug }) => heroAssets(slug, true, false).has(asset));
}
