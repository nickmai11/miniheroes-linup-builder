import { z } from "zod";
import { nicknameInputSchema } from "@/lib/nickname-input";

const deviceKey = z
  .string()
  .regex(/^device:[1-9][0-9]*$/)
  .refine((value) => Number(value.slice(7)) <= 2147483647);
const viewerKey = z.union([
  deviceKey,
  z.string().regex(/^admin:[0-9a-f-]{36}$/i),
]);

export const managedNicknameSchema = nicknameInputSchema.extend({ viewerKey });
export const revokeUserSchema = z.object({ viewerKey: deviceKey }).strict();

export type ManagedUser = {
  viewerKey: string;
  nickname: string | null;
  kind: "admin" | "invited";
  isYou: boolean;
  createdAt: string | null;
  fullAccess: boolean;
  invitedLineups: number;
  sharedItems: number;
};
