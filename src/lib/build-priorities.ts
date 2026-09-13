export const BUILD_PRIORITIES = ["must", "optional"] as const;
export type BuildPriority = (typeof BUILD_PRIORITIES)[number];
export const DEFAULT_BUILD_PRIORITY: BuildPriority = "optional";

export const BUILD_PRIORITY_LABELS: Record<BuildPriority, string> = {
  must: "Must have",
  optional: "OK to have",
};

/** A third click removes the selection. */
export function nextBuildPriority(
  priority?: BuildPriority,
): BuildPriority | undefined {
  if (priority === undefined) return "must";
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
