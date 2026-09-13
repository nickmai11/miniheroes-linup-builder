"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { LINEUP_SIZE } from "@/db/schema";
import {
  canEditLocally,
  LOCAL_EDITING_ERROR,
  requireLocalEditing,
} from "@/lib/local-editing";

export type LineupActionState = { error?: string };

const lineupSchema = z.object({
  name: z.string().trim().min(1, "Give the lineup a name").max(120),
  description: z.string().trim().max(5000).default(""),
  // Slot index -> hero id; null for an empty slot.
  slots: z
    .array(z.number().int().positive().nullable())
    .length(LINEUP_SIZE)
    .refine((s) => s.some((id) => id !== null), "Pick at least one hero")
    .refine((s) => {
      const ids = s.filter((id): id is number => id !== null);
      return new Set(ids).size === ids.length;
    }, "A hero can only appear once"),
});

export type LineupInput = z.input<typeof lineupSchema>;

export async function saveLineup(
  input: LineupInput,
): Promise<LineupActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  const parsed = lineupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lineup" };
  }
  const { name, description, slots } = parsed.data;

  const heroIds = slots.filter((id): id is number => id !== null);
  const known = await db.select({ id: schema.heroes.id }).from(schema.heroes);
  const knownIds = new Set(known.map((h) => h.id));
  if (!heroIds.every((id) => knownIds.has(id))) {
    return { error: "One of the selected heroes no longer exists" };
  }

  const [lineup] = await db
    .insert(schema.lineups)
    .values({ name, description })
    .returning({ id: schema.lineups.id });

  await db
    .insert(schema.lineupHeroes)
    .values(
      slots.flatMap((heroId, position) =>
        heroId === null ? [] : [{ lineupId: lineup.id, heroId, position }],
      ),
    );

  revalidatePath("/lineups");
  redirect(`/lineups/${lineup.id}`);
}

export async function deleteLineup(id: number) {
  await requireLocalEditing();
  await db.delete(schema.lineups).where(eq(schema.lineups.id, id));
  revalidatePath("/lineups");
  redirect("/lineups");
}
