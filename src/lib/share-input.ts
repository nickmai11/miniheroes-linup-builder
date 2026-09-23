import { z } from "zod";

export const shareTargetSchema = z.object({
  kind: z.enum(["lineup", "build"]),
  id: z.number().int().positive().max(2147483647),
});
export const shareInputSchema = shareTargetSchema
  .extend({
    recipientIds: z.array(z.number().int().positive()).max(1000),
  })
  .strict();
export type ShareTarget = z.infer<typeof shareTargetSchema>;
export type ShareRecipient = {
  id: number;
  nickname: string;
  selected: boolean;
};
