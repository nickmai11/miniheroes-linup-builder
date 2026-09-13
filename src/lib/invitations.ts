import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  isDeviceToken,
  normalizeInvitationCode,
} from "@/lib/invitation-policy";

export function hashInvitationSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function generateInvitationCode(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomBytes(12).toString("hex").toUpperCase();
    const [inserted] = await db
      .insert(schema.invitationCodes)
      .values({ codeHash: hashInvitationSecret(code) })
      .onConflictDoNothing()
      .returning({ id: schema.invitationCodes.id });
    if (inserted) return code.match(/.{4}/g)!.join("-");
  }
  throw new Error("Could not generate a unique invitation code.");
}

export async function findRegisteredDevice(token: unknown) {
  if (!isDeviceToken(token)) return null;
  const [device] = await db
    .select({ id: schema.registeredDevices.id })
    .from(schema.registeredDevices)
    .where(eq(schema.registeredDevices.tokenHash, hashInvitationSecret(token)))
    .limit(1);
  return device ?? null;
}

class DeviceAlreadyRegistered extends Error {}

/** Claim the code and register the browser together, including concurrent retries. */
export async function redeemInvitationCode(
  value: unknown,
  token: string,
): Promise<boolean> {
  if (!isDeviceToken(token)) return false;
  const tokenHash = hashInvitationSecret(token);
  const code = normalizeInvitationCode(value);
  try {
    return await db.transaction(async (tx) => {
      const registered = async () => {
        const [device] = await tx
          .select({ id: schema.registeredDevices.id })
          .from(schema.registeredDevices)
          .where(eq(schema.registeredDevices.tokenHash, tokenHash))
          .limit(1);
        return Boolean(device);
      };
      if (await registered()) return true;
      if (!code) return false;
      const [invitation] = await tx
        .update(schema.invitationCodes)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(schema.invitationCodes.codeHash, hashInvitationSecret(code)),
            isNull(schema.invitationCodes.usedAt),
          ),
        )
        .returning({ id: schema.invitationCodes.id });
      if (!invitation) return registered();
      const [device] = await tx
        .insert(schema.registeredDevices)
        .values({ tokenHash, invitationId: invitation.id })
        .onConflictDoNothing({ target: schema.registeredDevices.tokenHash })
        .returning({ id: schema.registeredDevices.id });
      // Roll back this claim if another code just registered the same browser.
      if (!device) throw new DeviceAlreadyRegistered();
      return true;
    });
  } catch (error) {
    if (error instanceof DeviceAlreadyRegistered)
      return Boolean(await findRegisteredDevice(token));
    throw error;
  }
}
