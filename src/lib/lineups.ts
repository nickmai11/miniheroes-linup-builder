import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Hero, Lineup } from "@/db/schema";

export type LineupWithHeroes = Lineup & {
  /** Slot index -> hero (missing slots are null). */
  slots: (Hero | null)[];
};

function assemble(
  lineupRows: Lineup[],
  slotRows: { lineupId: number; position: number; hero: Hero }[],
): LineupWithHeroes[] {
  return lineupRows.map((l) => {
    const slots: (Hero | null)[] = Array.from(
      { length: schema.LINEUP_SIZE },
      () => null,
    );
    for (const s of slotRows) {
      if (s.lineupId === l.id && s.position < schema.LINEUP_SIZE) {
        slots[s.position] = s.hero;
      }
    }
    return { ...l, slots };
  });
}

async function loadSlots(lineupIds: number[]) {
  if (lineupIds.length === 0) return [];
  return db
    .select({
      lineupId: schema.lineupHeroes.lineupId,
      position: schema.lineupHeroes.position,
      hero: schema.heroes,
    })
    .from(schema.lineupHeroes)
    .innerJoin(schema.heroes, eq(schema.lineupHeroes.heroId, schema.heroes.id))
    .where(inArray(schema.lineupHeroes.lineupId, lineupIds))
    .orderBy(asc(schema.lineupHeroes.position));
}

export async function getAllLineups(): Promise<LineupWithHeroes[]> {
  const lineupRows = await db
    .select()
    .from(schema.lineups)
    .orderBy(desc(schema.lineups.createdAt));
  const slotRows = await loadSlots(lineupRows.map((l) => l.id));
  return assemble(lineupRows, slotRows);
}

export async function getLineup(
  id: number,
): Promise<LineupWithHeroes | undefined> {
  const lineupRows = await db
    .select()
    .from(schema.lineups)
    .where(eq(schema.lineups.id, id));
  if (lineupRows.length === 0) return undefined;
  const slotRows = await loadSlots([id]);
  return assemble(lineupRows, slotRows)[0];
}
