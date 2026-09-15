"use server";

import { requireAppAccess } from "@/lib/app-access";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import {
  lineupSnapshot,
  lockContentWrites,
  recordChange,
} from "@/lib/change-recording";
import { lineupSchema, type LineupInput } from "@/lib/lineup-input";
import { canEditContent, EDITING_ERROR, requireEditing } from "@/lib/editing";

export type LineupActionState = { error?: string; id?: number };

export async function saveLineup(
  input: LineupInput,
): Promise<LineupActionState> {
  if (!(await canEditContent())) return { error: EDITING_ERROR };
  await requireAppAccess();
  const parsed = lineupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lineup" };
  }
  const { id, name, description, slots, fishSelections } = parsed.data;
  const fishIds = fishSelections.map((selection) => selection.fishId);
  const buildIds = slots.flatMap((slot) =>
    slot?.buildId ? [slot.buildId] : [],
  );

  const [knownHeroes, knownPets, knownRelics, knownBuilds, knownFishes] =
    await Promise.all([
      db.select({ id: schema.heroes.id }).from(schema.heroes),
      db.select({ id: schema.pets.id }).from(schema.pets),
      db.select({ id: schema.relics.id }).from(schema.relics),
      buildIds.length
        ? db
            .select({
              id: schema.heroBuilds.id,
              heroId: schema.heroBuilds.heroId,
            })
            .from(schema.heroBuilds)
            .where(inArray(schema.heroBuilds.id, buildIds))
        : [],
      fishIds.length
        ? db
            .select({ id: schema.fishes.id })
            .from(schema.fishes)
            .where(inArray(schema.fishes.id, fishIds))
        : [],
    ]);
  if (knownFishes.length !== fishIds.length) {
    return { error: "One of the selected fishes no longer exists" };
  }
  const heroIds = new Set(knownHeroes.map((hero) => hero.id));
  const petIds = new Set(knownPets.map((pet) => pet.id));
  const relicIds = new Set(knownRelics.map((relic) => relic.id));
  if (slots.some((slot) => slot && !heroIds.has(slot.heroId))) {
    return { error: "One of the selected heroes no longer exists" };
  }
  const buildOwners = new Map(
    knownBuilds.map((build) => [build.id, build.heroId]),
  );
  if (
    slots.some(
      (slot) => slot?.buildId && buildOwners.get(slot.buildId) !== slot.heroId,
    )
  ) {
    return { error: "Choose a saved build belonging to the selected hero" };
  }
  if (slots.some((slot) => slot?.petIds.some((petId) => !petIds.has(petId)))) {
    return { error: "One of the selected pets no longer exists" };
  }
  if (
    slots.some((slot) =>
      slot?.relicIds.some((relicId) => !relicIds.has(relicId)),
    )
  ) {
    return { error: "One of the selected relics no longer exists" };
  }

  // Check on each save so applying migration 0024 enables quantities immediately.
  const [fishStorage] = fishIds.length
    ? await db.execute<{ supportsQuantities: boolean }>(sql`
        select exists (
          select 1 from information_schema.columns
          where table_schema = current_schema()
            and table_name = 'lineup_fishes' and column_name = 'quantity'
        ) as "supportsQuantities"
      `)
    : [];
  if (
    !fishStorage?.supportsQuantities &&
    fishSelections.some(({ quantity }) => quantity > 1)
  ) {
    return {
      error:
        "Multiple copies of a fish aren't available yet. Choose one copy per fish to save; your lineup hasn't been changed.",
    };
  }

  const lineup = await db.transaction(async (tx) => {
    await lockContentWrites(tx);
    if (id !== undefined) {
      await tx
        .select({ id: schema.lineups.id })
        .from(schema.lineups)
        .where(eq(schema.lineups.id, id))
        .for("update");
    }
    const before = id === undefined ? null : await lineupSnapshot(tx, id);
    // Updating the parent also serializes concurrent saves of this lineup.
    const [saved] =
      id === undefined
        ? await tx
            .insert(schema.lineups)
            .values({ name, description })
            .returning({ id: schema.lineups.id })
        : await tx
            .update(schema.lineups)
            .set({ name, description })
            .where(eq(schema.lineups.id, id))
            .returning({ id: schema.lineups.id });
    if (!saved) return undefined;

    if (id !== undefined) {
      await tx
        .delete(schema.lineupFishes)
        .where(eq(schema.lineupFishes.lineupId, id));
      await tx
        .delete(schema.lineupHeroes)
        .where(eq(schema.lineupHeroes.lineupId, id));
    }
    const savedSlots = await tx
      .insert(schema.lineupHeroes)
      .values(
        slots.flatMap((slot, position) =>
          slot
            ? [
                {
                  lineupId: saved.id,
                  heroId: slot.heroId,
                  buildId: slot.buildId,
                  position,
                },
              ]
            : [],
        ),
      )
      .returning();
    const pets = savedSlots.flatMap((slot) =>
      slots[slot.position]!.petIds.map((petId, sortOrder) => ({
        lineupHeroId: slot.id,
        petId,
        sortOrder,
      })),
    );
    const relics = savedSlots.flatMap((slot) =>
      slots[slot.position]!.relicIds.map((relicId, sortOrder) => ({
        lineupHeroId: slot.id,
        relicId,
        sortOrder,
      })),
    );
    if (pets.length) await tx.insert(schema.lineupHeroPets).values(pets);
    if (relics.length) await tx.insert(schema.lineupHeroRelics).values(relics);
    if (fishIds.length) {
      if (fishStorage?.supportsQuantities) {
        await tx.insert(schema.lineupFishes).values(
          fishSelections.map(({ fishId, quantity }, sortOrder) => ({
            lineupId: saved.id,
            fishId,
            quantity,
            sortOrder,
          })),
        );
      } else {
        // Omit the quantity column entirely until migration 0024 is applied.
        await tx.execute(sql`
          insert into ${schema.lineupFishes} (lineup_id, fish_id, sort_order)
          values ${sql.join(
            fishSelections.map(
              ({ fishId }, sortOrder) =>
                sql`(${saved.id}, ${fishId}, ${sortOrder})`,
            ),
            sql`, `,
          )}
        `);
      }
    }
    await recordChange(
      tx,
      "lineup",
      saved.id,
      id === undefined ? "created" : "updated",
      before,
      await lineupSnapshot(tx, saved.id),
    );
    return saved;
  });
  if (!lineup) return { error: "This lineup no longer exists" };

  revalidatePath("/lineups");
  revalidatePath("/");
  revalidatePath(`/lineups/${lineup.id}`);
  revalidatePath(`/lineups/${lineup.id}/edit`);
  revalidatePath("/heroes/[slug]", "page");
  // Let the browser navigate to the saved lineup with its original host.
  return { id: lineup.id };
}

export async function deleteLineup(id: number) {
  await requireEditing();
  await requireAppAccess();
  await db.transaction(async (tx) => {
    await lockContentWrites(tx);
    await tx
      .select({ id: schema.lineups.id })
      .from(schema.lineups)
      .where(eq(schema.lineups.id, id))
      .for("update");
    const before = await lineupSnapshot(tx, id);
    await tx.delete(schema.lineups).where(eq(schema.lineups.id, id));
    await recordChange(tx, "lineup", id, "deleted", before, null);
  });
  revalidatePath("/lineups");
  revalidatePath("/");
  revalidatePath("/heroes/[slug]", "page");
  redirect("/lineups");
}
