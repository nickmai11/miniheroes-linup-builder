import type { HeroBuild } from "@/lib/build-types";
import type { BuildPriority } from "@/lib/build-priorities";

/** Pick order remains stable within each separately assigned tier. */
export type BuildDraft = {
  id?: number;
  name: string;
  notes: string;
  runeIds: number[];
  weaponIds: number[];
  coreIds: number[];
  runePriorities: Record<number, BuildPriority>;
  weaponPriorities: Record<number, BuildPriority>;
  corePriorities: Record<number, BuildPriority>;
};

/** Clones have independent selections and no ID, so saving creates a new build. */
export function createBuildDraft(
  build?: HeroBuild,
  asCopy = false,
): BuildDraft {
  const suffix = " (copy)";
  return {
    ...(!asCopy && build ? { id: build.id } : {}),
    name:
      asCopy && build
        ? `${build.name.slice(0, 120 - suffix.length)}${suffix}`
        : (build?.name ?? ""),
    notes: build?.notes ?? "",
    runeIds: build?.runes.map((r) => r.id) ?? [],
    weaponIds: build?.weapons.map((w) => w.id) ?? [],
    coreIds: build?.cores.map((c) => c.id) ?? [],
    runePriorities: Object.fromEntries(
      build?.runes.map((r) => [r.id, r.priority]) ?? [],
    ),
    weaponPriorities: Object.fromEntries(
      build?.weapons.map((w) => [w.id, w.priority]) ?? [],
    ),
    corePriorities: Object.fromEntries(
      build?.cores.map((c) => [c.id, c.priority]) ?? [],
    ),
  };
}
