import { cache } from "react";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Fish, Hero, Lineup, Pet, Relic } from "@/db/schema";
import type { HeroBuild } from "@/lib/build-types";
import { getBuildsByIds, getHeroIdsWithBuilds } from "@/lib/builds";
import { lineupOrder } from "@/lib/lineup-order";
import {
  divinitiesByHeroIds,
  syncSeededHeroDetails,
  type HeroWithDivinities,
} from "./heroes";

export type LineupHeroWithAssignments = HeroWithDivinities & {
  pets: Pet[];
  relics: Relic[];
  build: HeroBuild | null;
};

export type LineupFish = Fish & { quantity: number };

export type LineupWithHeroes = Lineup & {
  fishes: LineupFish[];
  /** Slot index -> hero (missing slots are null). */
  slots: (LineupHeroWithAssignments | null)[];
};

async function assemble(
  lineupRows: Lineup[],
  slotRows: {
    id: number;
    lineupId: number;
    position: number;
    hero: Hero;
    buildId: number | null;
  }[],
): Promise<LineupWithHeroes[]> {
  const slotIds = slotRows.map((slot) => slot.id);
  const heroIds = [...new Set(slotRows.map((slot) => slot.hero.id))];
  const [byHero, heroIdsWithBuilds, petRows, relicRows, builds, fishRows] =
    await Promise.all([
      divinitiesByHeroIds(heroIds),
      getHeroIdsWithBuilds(heroIds),
      slotIds.length
        ? db
            .select({
              slotId: schema.lineupHeroPets.lineupHeroId,
              pet: schema.pets,
            })
            .from(schema.lineupHeroPets)
            .innerJoin(
              schema.pets,
              eq(schema.lineupHeroPets.petId, schema.pets.id),
            )
            .where(inArray(schema.lineupHeroPets.lineupHeroId, slotIds))
            .orderBy(asc(schema.lineupHeroPets.sortOrder))
        : [],
      slotIds.length
        ? db
            .select({
              slotId: schema.lineupHeroRelics.lineupHeroId,
              relic: schema.relics,
            })
            .from(schema.lineupHeroRelics)
            .innerJoin(
              schema.relics,
              eq(schema.lineupHeroRelics.relicId, schema.relics.id),
            )
            .where(inArray(schema.lineupHeroRelics.lineupHeroId, slotIds))
            .orderBy(asc(schema.lineupHeroRelics.sortOrder))
        : [],
      getBuildsByIds([
        ...new Set(
          slotRows.flatMap((slot) =>
            slot.buildId === null ? [] : [slot.buildId],
          ),
        ),
      ]),
      lineupRows.length
        ? db
            .select({
              lineupId: schema.lineupFishes.lineupId,
              fish: schema.fishes,
              // A missing JSON key also supports databases awaiting migration 0024.
              quantity: sql<number>`coalesce((to_jsonb(${schema.lineupFishes})->>'quantity')::integer, 1)`,
            })
            .from(schema.lineupFishes)
            .innerJoin(
              schema.fishes,
              eq(schema.lineupFishes.fishId, schema.fishes.id),
            )
            .where(
              inArray(
                schema.lineupFishes.lineupId,
                lineupRows.map((lineup) => lineup.id),
              ),
            )
            .orderBy(asc(schema.lineupFishes.sortOrder))
        : [],
    ]);
  const fishesByLineup = new Map<number, LineupFish[]>();
  for (const { lineupId, fish, quantity } of fishRows) {
    const fishes = fishesByLineup.get(lineupId) ?? [];
    fishes.push({ ...fish, quantity });
    fishesByLineup.set(lineupId, fishes);
  }
  const buildsById = new Map(builds.map((build) => [build.id, build]));
  const petsBySlot = new Map<number, Pet[]>();
  const relicsBySlot = new Map<number, Relic[]>();
  for (const { slotId, pet } of petRows) {
    const pets = petsBySlot.get(slotId) ?? [];
    pets.push(pet);
    petsBySlot.set(slotId, pets);
  }
  for (const { slotId, relic } of relicRows) {
    const relics = relicsBySlot.get(slotId) ?? [];
    relics.push(relic);
    relicsBySlot.set(slotId, relics);
  }
  return lineupRows.map((l) => {
    const slots: (LineupHeroWithAssignments | null)[] = Array.from(
      { length: schema.LINEUP_SIZE },
      () => null,
    );
    for (const s of slotRows) {
      if (s.lineupId === l.id && s.position < schema.LINEUP_SIZE) {
        slots[s.position] = {
          ...s.hero,
          divinities: byHero.get(s.hero.id) ?? [],
          hasBuild: heroIdsWithBuilds.has(s.hero.id),
          pets: petsBySlot.get(s.id) ?? [],
          relics: relicsBySlot.get(s.id) ?? [],
          build:
            s.buildId !== null &&
            buildsById.get(s.buildId)?.heroId === s.hero.id
              ? buildsById.get(s.buildId)!
              : null,
        };
      }
    }
    return { ...l, slots, fishes: fishesByLineup.get(l.id) ?? [] };
  });
}

async function loadSlots(lineupIds: number[]) {
  if (lineupIds.length === 0) return [];
  return db
    .select({
      id: schema.lineupHeroes.id,
      buildId: schema.lineupHeroes.buildId,
      lineupId: schema.lineupHeroes.lineupId,
      position: schema.lineupHeroes.position,
      hero: schema.heroes,
    })
    .from(schema.lineupHeroes)
    .innerJoin(schema.heroes, eq(schema.lineupHeroes.heroId, schema.heroes.id))
    .where(inArray(schema.lineupHeroes.lineupId, lineupIds))
    .orderBy(asc(schema.lineupHeroes.position));
}

export async function getAllLineups(
  lineupIds: number[] | null = null,
): Promise<LineupWithHeroes[]> {
  if (lineupIds?.length === 0) return [];
  await syncSeededHeroDetails();
  const lineupRows = await db
    .select()
    .from(schema.lineups)
    .where(
      lineupIds === null ? undefined : inArray(schema.lineups.id, lineupIds),
    )
    .orderBy(...lineupOrder());
  const slotRows = await loadSlots(lineupRows.map((l) => l.id));
  return assemble(lineupRows, slotRows);
}

export const getLineup = cache(async function getLineup(
  id: number,
): Promise<LineupWithHeroes | undefined> {
  await syncSeededHeroDetails();
  const lineupRows = await db
    .select()
    .from(schema.lineups)
    .where(eq(schema.lineups.id, id));
  if (lineupRows.length === 0) return undefined;
  const slotRows = await loadSlots([id]);
  return (await assemble(lineupRows, slotRows))[0];
});
