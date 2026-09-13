import { z } from "zod";

const idList = z.array(z.number().int().positive()).max(200);

export const buildSchema = z
  .object({
    id: z.number().int().positive().optional(),
    heroId: z.number().int().positive(),
    name: z.string().trim().min(1, "Give the build a name").max(120),
    notes: z.string().trim().max(5000).default(""),
    runeAttributeIds: idList,
    weaponAttributeIds: idList,
    coreIds: idList.default([]),
  })
  .refine(
    (b) =>
      b.runeAttributeIds.length +
        b.weaponAttributeIds.length +
        b.coreIds.length >
      0,
    "Pick at least one rune attribute, weapon attribute, or core",
  );

export type BuildInput = z.input<typeof buildSchema>;
