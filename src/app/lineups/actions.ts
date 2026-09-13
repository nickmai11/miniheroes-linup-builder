"use server";

import { requireAppAccess } from "@/lib/app-access";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { lineupSchema, type LineupInput } from "@/lib/lineup-input";
import {
  canEditLocally,
  LOCAL_EDITING_ERROR,
  requireLocalEditing,
} from "@/lib/local-editing";

export type LineupActionState = { error?: string; id?: number };

export async function saveLineup(
  input: LineupInput,
): Promise<LineupActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  await requireAppAccess();
  const parsed = lineupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lineup" };
  }
  const { id, name, description, slots } = parsed.data;
  const buildIds = slots.flatMap((slot) =>
    slot?.buildId ? [slot.buildId] : [],
  );

  const [knownHeroes, knownPets, knownRelics, knownBuilds] = await Promise.all([
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
  ]);
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

  const lineup = await db.transaction(async (tx) => {
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
    return saved;
  });
  if (!lineup) return { error: "This lineup no longer exists" };

  revalidatePath("/lineups");
  revalidatePath(`/lineups/${lineup.id}`);
  revalidatePath(`/lineups/${lineup.id}/edit`);
  revalidatePath("/heroes/[slug]", "page");
  // Let the browser navigate with its original host. Next's internal redirect
  // fetch changes localhost to 127.0.0.1, which fails the local editing guard.
  return { id: lineup.id };
}

export async function deleteLineup(id: number) {
  await requireLocalEditing();
  await requireAppAccess();
  await db.delete(schema.lineups).where(eq(schema.lineups.id, id));
  revalidatePath("/lineups");
  redirect("/lineups");
}
