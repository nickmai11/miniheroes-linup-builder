import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import { getRegisteredDevice } from "@/lib/app-access";
import { nicknameInputSchema } from "@/lib/nickname-input";

/** Never accept an identity from the browser; admins and IC devices stay separate. */
export async function getViewerKey(): Promise<string | null> {
  const adminId = await getAdminId();
  if (adminId) return `admin:${adminId}`;
  const device = await getRegisteredDevice();
  return device ? `device:${device.id}` : null;
}

export const getViewerProfile = cache(async () => {
  const key = await getViewerKey();
  if (!key) return null;
  const [profile] = await db
    .select({ nickname: schema.viewerProfiles.nickname })
    .from(schema.viewerProfiles)
    .where(eq(schema.viewerProfiles.viewerKey, key));
  return { nickname: profile?.nickname ?? null };
});

export async function saveViewerNickname(input: unknown) {
  const key = await getViewerKey();
  if (!key)
    return {
      error: "Use an invitation or sign in to set your nickname.",
      status: 401,
    };
  const parsed = nicknameInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Enter your nickname.",
      status: 400,
    };
  const { nickname } = parsed.data;
  const [saved] = await db
    .insert(schema.viewerProfiles)
    .values({ viewerKey: key, nickname })
    .onConflictDoUpdate({
      target: schema.viewerProfiles.viewerKey,
      set: { nickname },
    })
    .returning({ nickname: schema.viewerProfiles.nickname });
  return { nickname: saved.nickname, status: 200 };
}
