export type ChangeKind = "lineup" | "build";
export type ChangeEvent = "created" | "updated" | "imported" | "deleted";
export type ChangeField = {
  label: string;
  before: string | null;
  after: string | null;
  selectionChanged?: boolean;
};
export type ChangeEntry = {
  id: number;
  kind: ChangeKind;
  targetId: number;
  name: string;
  heroName: string | null;
  heroSlug: string | null;
  event: ChangeEvent;
  fields: ChangeField[];
  createdAt: Date | string;
  href?: string | null;
};
export type ChangePage = { entries: ChangeEntry[]; nextCursor: number | null };

export function changedFields(
  before: Record<string, string> | null,
  after: Record<string, string> | null,
  beforeIdentity?: Record<string, unknown>,
  afterIdentity?: Record<string, unknown>,
): ChangeField[] {
  return [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ]
    .filter(
      (label) =>
        (before?.[label] ?? "") !== (after?.[label] ?? "") ||
        (before &&
          after &&
          JSON.stringify(beforeIdentity?.[label]) !==
            JSON.stringify(afterIdentity?.[label])),
    )
    .map((label) => ({
      label,
      before: before?.[label] || null,
      after: after?.[label] || null,
      ...((before?.[label] ?? "") === (after?.[label] ?? "")
        ? { selectionChanged: true }
        : {}),
    }));
}
