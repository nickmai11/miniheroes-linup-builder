"use server";

import { requireAppAccess } from "@/lib/app-access";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  canEditLocally,
  LOCAL_EDITING_ERROR,
  requireLocalEditing,
} from "@/lib/local-editing";

const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().max(5000),
});

export type ActionState = { error?: string };

export async function createNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await canEditLocally())) return { error: LOCAL_EDITING_ERROR };
  await requireAppAccess();
  const parsed = createNoteSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await db.insert(schema.notes).values(parsed.data);
  revalidatePath("/notes");
  return {};
}

export async function deleteNote(id: number) {
  await requireLocalEditing();
  await requireAppAccess();
  await db.delete(schema.notes).where(eq(schema.notes.id, id));
  revalidatePath("/notes");
}
