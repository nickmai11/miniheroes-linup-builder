"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { canEditContent, EDITING_ERROR } from "@/lib/editing";
import { requireAppAccess } from "@/lib/app-access";

export type FishActionState = { error?: string; saved?: boolean };
const sizeSchema = z.coerce.number().min(0.01).max(1_000_000_000);

export async function updateFishMeasurements(
  _previous: FishActionState,
  formData: FormData,
): Promise<FishActionState> {
  if (!(await canEditContent())) return { error: EDITING_ERROR };
  await requireAppAccess();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const bestSize = sizeSchema.safeParse(formData.get("bestSizeCm"));
  if (!id.success || !bestSize.success)
    return { error: "Enter a valid highest record in cm." };

  const [fish] = await db
    .select()
    .from(schema.fishes)
    .where(eq(schema.fishes.id, id.data));
  if (!fish) return { error: "Fish not found." };

  try {
    await db
      .update(schema.fishes)
      .set({ bestSizeCm: bestSize.data })
      .where(eq(schema.fishes.id, id.data));
  } catch {
    return { error: "Could not save fish. Please try again." };
  }
  revalidatePath("/fishes");
  revalidatePath("/lineups", "layout");
  return { saved: true };
}
