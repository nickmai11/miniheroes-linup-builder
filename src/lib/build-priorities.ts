export const BUILD_PRIORITIES = ["important", "must", "optional"] as const;
export type BuildPriority = (typeof BUILD_PRIORITIES)[number];
export const DEFAULT_BUILD_PRIORITY: BuildPriority = "optional";

export const BUILD_PRIORITY_LABELS: Record<BuildPriority, string> = {
  important: "Important",
  must: "Should have",
  optional: "OK to have",
};

/** Cycle through the available tiers, then remove the selection. */
export function nextBuildPriority(
  priority?: BuildPriority,
): BuildPriority | undefined {
  if (priority === undefined) return BUILD_PRIORITIES[0];
  return BUILD_PRIORITIES[BUILD_PRIORITIES.indexOf(priority) + 1];
}

/** Keep pick order within each tier. */
export function sortByBuildPriority<T extends { priority: BuildPriority }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      BUILD_PRIORITIES.indexOf(a.priority) -
      BUILD_PRIORITIES.indexOf(b.priority),
  );
}
