import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { isDeviceToken } from "@/lib/invitation-policy";

/** How long a sealed token may travel from the old host to the new one. */
export const TRANSFER_TTL_MS = 2 * 60 * 1000;

// Every host of the app shares the database, so its connection string is the
// one secret they already have in common. It is never used directly.
let transferKey: Buffer | undefined;
function key(): Buffer {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required to move registered browsers.");
  return (transferKey ??= createHash("sha256")
    .update(`device-transfer:${process.env.DATABASE_URL}`)
    .digest());
}

/** Wrap a device token so only this app can read it, and only briefly. */
export function sealDeviceTransfer(token: string, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([
    cipher.update(`${now + TRANSFER_TTL_MS}.${token}`, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** Recover the token from a sealed transfer, or null if forged or expired. */
export function openDeviceTransfer(
  value: unknown,
  now = Date.now(),
): string | null {
  if (typeof value !== "string" || value.length > 256) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length <= 28) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      raw.subarray(0, 12),
    );
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([
      decipher.update(raw.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
    const separator = text.indexOf(".");
    const expires = Number(text.slice(0, separator));
    const token = text.slice(separator + 1);
    return expires > now && isDeviceToken(token) ? token : null;
  } catch {
    return null;
  }
}
