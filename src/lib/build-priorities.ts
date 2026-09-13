export const BUILD_PRIORITIES = ["must", "optional"] as const;
export const RUNE_BUILD_PRIORITIES = [
  "important",
  ...BUILD_PRIORITIES,
] as const;
export type BuildPriority = (typeof RUNE_BUILD_PRIORITIES)[number];
export const DEFAULT_BUILD_PRIORITY: BuildPriority = "optional";

export const BUILD_PRIORITY_LABELS: Record<BuildPriority, string> = {
  important: "Important",
  must: "Should have",
  optional: "OK to have",
};

/** Cycle through the available tiers, then remove the selection. */
export function nextBuildPriority(
  priority?: BuildPriority,
  priorities: readonly BuildPriority[] = BUILD_PRIORITIES,
): BuildPriority | undefined {
  if (priority === undefined) return priorities[0];
  return priorities[priorities.indexOf(priority) + 1];
}

/** Keep pick order within each tier. */
export function sortByBuildPriority<T extends { priority: BuildPriority }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      RUNE_BUILD_PRIORITIES.indexOf(a.priority) -
      RUNE_BUILD_PRIORITIES.indexOf(b.priority),
  );
}
