import { z } from "zod";
import { BUILD_PRIORITIES } from "@/lib/build-priorities";

const idList = z.array(z.number().int().positive()).max(200);
const priorityMap = z.record(
  z.string().regex(/^[1-9]\d*$/),
  z.enum(BUILD_PRIORITIES),
);

export const buildSchema = z
  .object({
    id: z.number().int().positive().optional(),
    heroId: z.number().int().positive(),
    name: z.string().trim().min(1, "Give the build a name").max(120),
    notes: z.string().trim().max(5000).default(""),
    runeAttributeIds: idList,
    weaponAttributeIds: idList,
    coreIds: idList.default([]),
    runePriorities: priorityMap.default({}),
    weaponPriorities: priorityMap.default({}),
    corePriorities: priorityMap.default({}),
  })
  .refine(
    (b) =>
      b.runeAttributeIds.length +
        b.weaponAttributeIds.length +
        b.coreIds.length >
      0,
    "Pick at least one rune attribute, weapon attribute, or core",
  )
  .superRefine((build, context) => {
    for (const [field, ids] of [
      ["runePriorities", build.runeAttributeIds],
      ["weaponPriorities", build.weaponAttributeIds],
      ["corePriorities", build.coreIds],
    ] as const) {
      const selected = new Set(ids);
      for (const id of Object.keys(build[field])) {
        if (!selected.has(Number(id))) {
          context.addIssue({
            code: "custom",
            path: [field, id],
            message: "Only selected attributes can have a priority",
          });
        }
      }
    }
  });

export type BuildInput = z.input<typeof buildSchema>;
