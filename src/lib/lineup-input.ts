import { z } from "zod";
import { LINEUP_SIZE } from "@/db/schema";

const selectionIds = z
  .array(z.number().int().positive())
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Each pet or relic can only be selected once per hero",
  );

export const lineupSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Give the lineup a name").max(120),
  description: z.string().trim().max(5000).default(""),
  fishIds: z
    .array(z.number().int().positive())
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Each fish can only be selected once per lineup",
    )
    .default([]),
  slots: z
    .array(
      z
        .object({
          heroId: z.number().int().positive(),
          buildId: z.number().int().positive().nullable().default(null),
          petIds: selectionIds.default([]),
          relicIds: selectionIds.default([]),
        })
        .nullable(),
    )
    .length(LINEUP_SIZE)
    .refine((slots) => slots.some(Boolean), "Pick at least one hero")
    .refine((slots) => {
      const ids = slots.flatMap((slot) => (slot ? [slot.heroId] : []));
      return new Set(ids).size === ids.length;
    }, "A hero can only appear once"),
});

export type LineupInput = z.input<typeof lineupSchema>;
export type LineupSlotInput = z.output<typeof lineupSchema>["slots"][number];
