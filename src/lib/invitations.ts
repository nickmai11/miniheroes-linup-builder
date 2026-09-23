import "server-only";
import { sharedDestinations } from "@/lib/share-access";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  type DeviceAccess,
  isDeviceToken,
  normalizeInvitationCode,
} from "@/lib/invitation-policy";

export function hashInvitationSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function generateInvitationCode(
  lineupId: number | null = null,
): Promise<string> {
  if (
    lineupId !== null &&
    (!Number.isInteger(lineupId) || lineupId < 1 || lineupId > 2147483647)
  )
    throw new Error("Invalid lineup.");
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomBytes(12).toString("hex").toUpperCase();
    const [inserted] = await db
      .insert(schema.invitationCodes)
      .values({ codeHash: hashInvitationSecret(code), lineupId })
      .onConflictDoNothing()
      .returning({ id: schema.invitationCodes.id });
    if (inserted) return code.match(/.{4}/g)!.join("-");
  }
  throw new Error("Could not generate a unique invitation code.");
}

async function deviceAccess(
  database: Pick<typeof db, "select">,
  tokenHash: string,
): Promise<DeviceAccess | null> {
  const rows = await database
    .select({
      id: schema.registeredDevices.id,
      invitationId: schema.invitationCodes.id,
      lineupId: schema.invitationCodes.lineupId,
    })
    .from(schema.registeredDevices)
    .leftJoin(
      schema.invitationRedemptions,
      eq(schema.invitationRedemptions.deviceId, schema.registeredDevices.id),
    )
    .leftJoin(
      schema.invitationCodes,
      // Older deployments can still register browsers between migration and
      // rollout. Their original invitation remains a valid full-library grant.
      eq(
        schema.invitationCodes.id,
        sql`coalesce(${schema.invitationRedemptions.invitationId}, ${schema.registeredDevices.invitationId})`,
      ),
    )
    .where(eq(schema.registeredDevices.tokenHash, tokenHash));
  if (!rows.length) return null;
  const shared = await sharedDestinations(`device:${rows[0].id}`, database);
  return {
    ...(shared.lineupIds.length
      ? {
          invitedLineupIds: [
            ...new Set(
              rows.flatMap((row) =>
                row.lineupId === null ? [] : [row.lineupId],
              ),
            ),
          ],
        }
      : {}),
    ...(shared.heroSlugs.length ? { sharedHeroSlugs: shared.heroSlugs } : {}),
    id: rows[0].id,
    fullAccess: rows.some(
      (row) => row.invitationId !== null && row.lineupId === null,
    ),
    lineupIds: [
      ...new Set([
        ...rows.flatMap((row) => (row.lineupId === null ? [] : [row.lineupId])),
        ...shared.lineupIds,
      ]),
    ],
  };
}

export async function findRegisteredDevice(
  token: unknown,
): Promise<DeviceAccess | null> {
  if (!isDeviceToken(token)) return null;
  return deviceAccess(db, hashInvitationSecret(token));
}

/** Rotate the credential without changing any of the device's grants. */
export async function rotateDeviceToken(
  token: unknown,
): Promise<string | null> {
  if (!isDeviceToken(token)) return null;
  const next = newDeviceToken();
  const [device] = await db
    .update(schema.registeredDevices)
    .set({ tokenHash: hashInvitationSecret(next) })
    .where(eq(schema.registeredDevices.tokenHash, hashInvitationSecret(token)))
    .returning({ id: schema.registeredDevices.id });
  return device ? next : null;
}

/** Atomically claim one code and add its grant, retaining this device's other grants. */
export async function redeemInvitationCode(
  value: unknown,
  token: string,
): Promise<boolean> {
  if (!isDeviceToken(token)) return false;
  const tokenHash = hashInvitationSecret(token);
  const code = normalizeInvitationCode(value);
  return db.transaction(async (tx) => {
    // Serialize the same browser's tabs, including its very first registration.
    // Different browsers still compete for a code through the conditional update.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${tokenHash}, 0))`,
    );
    let device = await deviceAccess(tx, tokenHash);
    if (device?.fullAccess) return true;
    if (!code) return false;
    const [invitation] = await tx
      .select()
      .from(schema.invitationCodes)
      .where(eq(schema.invitationCodes.codeHash, hashInvitationSecret(code)))
      .limit(1);
    if (!invitation) return false;
    if (invitation.usedAt) {
      const [redemption] = await tx
        .select()
        .from(schema.invitationRedemptions)
        .where(
          and(
            eq(schema.invitationRedemptions.invitationId, invitation.id),
            eq(schema.invitationRedemptions.deviceId, device?.id ?? 0),
          ),
        );
      return Boolean(redemption);
    }
    // No need to consume an unused invitation for a lineup already granted.
    if (
      invitation.lineupId !== null &&
      (device?.invitedLineupIds ?? device?.lineupIds)?.includes(
        invitation.lineupId,
      )
    )
      return true;
    const [claimed] = await tx
      .update(schema.invitationCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(schema.invitationCodes.id, invitation.id),
          isNull(schema.invitationCodes.usedAt),
        ),
      )
      .returning({ id: schema.invitationCodes.id });
    if (!claimed) return false;
    if (!device) {
      const [created] = await tx
        .insert(schema.registeredDevices)
        .values({ tokenHash, invitationId: invitation.id })
        .returning({ id: schema.registeredDevices.id });
      device = { id: created.id, fullAccess: false, lineupIds: [] };
    }
    await tx
      .insert(schema.invitationRedemptions)
      .values({ invitationId: invitation.id, deviceId: device.id });
    return true;
  });
}
