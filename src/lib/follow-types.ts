import { z } from "zod";

export const followTargetSchema = z.object({
  kind: z.enum(["lineup", "hero"]),
  id: z.number().int().min(1).max(2147483647),
});
export const followInputSchema = followTargetSchema.extend({
  following: z.boolean(),
});
export type FollowTarget = z.infer<typeof followTargetSchema>;
export type FollowSummary = { following: boolean; canFollow: boolean };
export type FollowedItem = FollowTarget & {
  name: string;
  slug: string | null;
  href: string | null;
  available: boolean;
};
