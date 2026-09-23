import "server-only";

import { eq, like, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminId } from "@/lib/admin-access";
import {
  managedNicknameSchema,
  revokeUserSchema,
  type ManagedUser,
} from "@/lib/user-management-input";

const forbidden = { error: "Sign in as admin to manage users.", status: 403 };
const missing = { error: "This user no longer exists.", status: 404 };

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const adminId = await getAdminId();
  if (!adminId) throw new Error(forbidden.error);
  const {
    registeredDevices: devices,
    viewerProfiles: profiles,
    invitationCodes: invitations,
    invitationRedemptions: redemptions,
    contentShares: shares,
  } = schema;
  const [rows, admins] = await Promise.all([
    db
      .select({
        id: devices.id,
        nickname: profiles.nickname,
        createdAt: devices.createdAt,
        fullAccess: sql<boolean>`bool_or(${invitations.id} is not null and ${invitations.lineupId} is null)`,
        invitedLineups: sql<number>`count(distinct ${invitations.lineupId})::integer`,
        sharedItems: sql<number>`(select count(*)::integer from ${shares} where ${shares.recipientKey} = 'device:' || ${devices.id})`,
      })
      .from(devices)
      .leftJoin(
        profiles,
        eq(profiles.viewerKey, sql`'device:' || ${devices.id}`),
      )
      .leftJoin(redemptions, eq(redemptions.deviceId, devices.id))
      .leftJoin(
        invitations,
        eq(
          invitations.id,
          sql`coalesce(${redemptions.invitationId}, ${devices.invitationId})`,
        ),
      )
      .groupBy(devices.id, profiles.nickname)
      .orderBy(devices.createdAt, devices.id),
    db
      .select({ viewerKey: profiles.viewerKey, nickname: profiles.nickname })
      .from(profiles)
      .where(like(profiles.viewerKey, "admin:%"))
      .orderBy(profiles.nickname, profiles.viewerKey),
  ]);
  const currentKey = `admin:${adminId}`;
  const adminUsers: ManagedUser[] = admins.map((profile) => ({
    ...profile,
    kind: "admin",
    isYou: profile.viewerKey === currentKey,
    createdAt: null,
    fullAccess: true,
    invitedLineups: 0,
    sharedItems: 0,
  }));
  if (!adminUsers.some((user) => user.isYou))
    adminUsers.unshift({
      viewerKey: currentKey,
      nickname: null,
      kind: "admin",
      isYou: true,
      createdAt: null,
      fullAccess: true,
      invitedLineups: 0,
      sharedItems: 0,
    });
  return [
    ...adminUsers,
    ...rows.map((row): ManagedUser => ({
      viewerKey: `device:${row.id}`,
      nickname: row.nickname,
      kind: "invited",
      isYou: false,
      createdAt: row.createdAt.toISOString(),
      fullAccess: row.fullAccess,
      invitedLineups: row.invitedLineups,
      sharedItems: row.sharedItems,
    })),
  ];
}

export async function updateManagedNickname(input: unknown) {
  const adminId = await getAdminId();
  if (!adminId) return forbidden;
  const parsed = managedNicknameSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Enter a valid user and nickname.", status: 400 };
  const { viewerKey, nickname } = parsed.data;
  return db.transaction(async (tx) => {
    if (viewerKey.startsWith("device:")) {
      // Serialize with revocation so an edit cannot recreate a removed profile.
      const [device] = await tx
        .select({ id: schema.registeredDevices.id })
        .from(schema.registeredDevices)
        .where(eq(schema.registeredDevices.id, Number(viewerKey.slice(7))))
        .for("update");
      if (!device) return missing;
    } else if (viewerKey !== `admin:${adminId}`) {
      const [profile] = await tx
        .select({ key: schema.viewerProfiles.viewerKey })
        .from(schema.viewerProfiles)
        .where(eq(schema.viewerProfiles.viewerKey, viewerKey))
        .for("update");
      if (!profile) return missing;
    }
    await tx
      .insert(schema.viewerProfiles)
      .values({ viewerKey, nickname })
      .onConflictDoUpdate({
        target: schema.viewerProfiles.viewerKey,
        set: { nickname },
      });
    return { viewerKey, nickname, status: 200 };
  });
}

export async function revokeManagedUser(input: unknown) {
  if (!(await getAdminId())) return forbidden;
  const parsed = revokeUserSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Choose an invited user to revoke access.", status: 400 };
  const { viewerKey } = parsed.data;
  return db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(schema.registeredDevices)
      .where(eq(schema.registeredDevices.id, Number(viewerKey.slice(7))))
      .returning({ id: schema.registeredDevices.id });
    if (!removed) return missing;
    // Used invitation codes stay consumed. Profile deletion cascades shares;
    // follow deletion cascades notifications. No credentials leave the server.
    await tx
      .delete(schema.viewerProfiles)
      .where(eq(schema.viewerProfiles.viewerKey, viewerKey));
    await tx
      .delete(schema.contentFollows)
      .where(eq(schema.contentFollows.followerKey, viewerKey));
    await tx
      .delete(schema.contentVotes)
      .where(eq(schema.contentVotes.voterKey, viewerKey));
    return { viewerKey, status: 200 };
  });
}
