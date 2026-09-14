import { z } from "zod";
import { LINEUP_SIZE } from "@/db/schema";
import { MAX_FISH_QUANTITY } from "@/lib/fish-selection";

const selectionIds = z
  .array(z.number().int().positive())
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Each pet or relic can only be selected once per hero",
  );

export const lineupSchema = z
  .object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(1, "Give the lineup a name").max(120),
    description: z.string().trim().max(5000).default(""),
    // Accept drafts from the earlier picker as one copy per fish.
    fishIds: z
      .array(z.number().int().positive())
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each fish can only be selected once per lineup",
      )
      .optional(),
    fishSelections: z
      .array(
        z.object({
          fishId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(MAX_FISH_QUANTITY).default(1),
        }),
      )
      .refine(
        (selections) =>
          new Set(selections.map((selection) => selection.fishId)).size ===
          selections.length,
        "Use the quantity to select multiple copies of a fish",
      )
      .optional(),
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
      .refine(
        (slots) => slots.every(Boolean),
        "Pick all five heroes before saving",
      )
      .refine((slots) => {
        const ids = slots.flatMap((slot) => (slot ? [slot.heroId] : []));
        return new Set(ids).size === ids.length;
      }, "A hero can only appear once"),
  })
  .transform(({ fishIds, fishSelections, ...lineup }) => ({
    ...lineup,
    fishSelections:
      fishSelections ??
      fishIds?.map((fishId) => ({ fishId, quantity: 1 })) ??
      [],
  }));

export type LineupInput = z.input<typeof lineupSchema>;
export type LineupSlotInput = z.output<typeof lineupSchema>["slots"][number];
