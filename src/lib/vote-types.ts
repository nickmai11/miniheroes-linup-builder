import { z } from "zod";

export const voteTargetSchema = z.object({
  kind: z.enum(["lineup", "build"]),
  id: z.number().int().min(1).max(2147483647),
  page: z.string().max(2048),
});
export const voteInputSchema = voteTargetSchema.extend({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export type VoteTarget = z.infer<typeof voteTargetSchema>;
export type VoteValue = -1 | 0 | 1;
export type VoteSummary = {
  likes: number;
  dislikes: number;
  vote: VoteValue;
  canVote: boolean;
};
