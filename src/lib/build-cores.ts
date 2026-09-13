/** Match imported gear names to the destination hero's own core effects. */
export function matchBuildCores(
  source: { name: string }[],
  target: { id: number; name: string }[],
) {
  const targetByName = new Map(target.map((core) => [core.name, core.id]));
  const coreIds: number[] = [];
  const skippedCoreNames: string[] = [];
  for (const name of new Set(source.map((core) => core.name))) {
    const id = targetByName.get(name);
    if (id !== undefined) coreIds.push(id);
    else skippedCoreNames.push(name);
  }
  return { coreIds, skippedCoreNames };
}
