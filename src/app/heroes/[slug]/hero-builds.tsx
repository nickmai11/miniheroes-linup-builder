"use client";

import { Download, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RUNE_TYPES,
  type HeroCore,
  type RuneAttribute,
  type RuneType,
  type WeaponAttribute,
} from "@/db/schema";
import type { HeroBuild } from "@/lib/build-types";
import {
  BUILD_PRIORITIES,
  BUILD_PRIORITY_LABELS,
  DEFAULT_BUILD_PRIORITY,
  nextBuildPriority,
  sortByBuildPriority,
  type BuildPriority,
} from "@/lib/build-priorities";
import { RUNE_TYPE_LABELS } from "@/lib/hero-labels";
import { cn } from "@/lib/utils";
import {
  deleteHeroBuild,
  importHeroBuild,
  saveHeroBuild,
} from "./build-actions";
import { HeroBuildImport } from "./hero-build-import";

type Props = {
  canEdit: boolean;
  heroId: number;
  heroName: string;
  builds: HeroBuild[];
  runeAttributes: RuneAttribute[];
  weaponAttributes: WeaponAttribute[];
  cores: HeroCore[];
};

/** Rune-type label without the trailing " Runes" (shown under a Runes section). */
function runeTypeShort(type: RuneType) {
  return RUNE_TYPE_LABELS[type].replace(/ Runes$/, "");
}

/** Pick order remains stable within each separately assigned tier. */
type Draft = {
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

const PRIORITY_FIELDS = {
  runeIds: "runePriorities",
  weaponIds: "weaponPriorities",
  coreIds: "corePriorities",
} as const;
type SelectionKey = keyof typeof PRIORITY_FIELDS;

function draftFrom(build?: HeroBuild): Draft {
  return {
    id: build?.id,
    name: build?.name ?? "",
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

function groupRunes<T extends RuneAttribute>(runes: T[]): [RuneType, T[]][] {
  return RUNE_TYPES.flatMap((t) => {
    const list = runes.filter((r) => r.runeType === t);
    return list.length > 0 ? [[t, list] as [RuneType, T[]]] : [];
  });
}

export function HeroBuilds({
  canEdit,
  heroId,
  heroName,
  builds,
  runeAttributes,
  weaponAttributes,
  cores,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const importButton = useRef<HTMLButtonElement>(null);
  const restoreImportFocus = useRef(false);

  useEffect(() => {
    if (!importing && !pending && restoreImportFocus.current) {
      importButton.current?.focus();
      restoreImportFocus.current = false;
    }
  }, [importing, pending]);

  function closeImport() {
    restoreImportFocus.current = true;
    setImporting(false);
    setError(null);
  }

  function startNew() {
    setNotice(null);
    setError(null);
    setImporting(false);
    setDraft(draftFrom());
  }
  function startEdit(build: HeroBuild) {
    setNotice(null);
    setError(null);
    setImporting(false);
    setDraft(draftFrom(build));
  }
  function cancel() {
    setDraft(null);
    setError(null);
  }

  function cyclePriority(key: SelectionKey, id: number) {
    setDraft((d) => {
      if (!d) return d;
      const field = PRIORITY_FIELDS[key];
      const selected = d[key].includes(id);
      const next = nextBuildPriority(
        selected ? (d[field][id] ?? DEFAULT_BUILD_PRIORITY) : undefined,
      );
      const priorities = { ...d[field] };
      if (next) priorities[id] = next;
      else delete priorities[id];
      const ids = next
        ? selected
          ? d[key]
          : [...d[key], id]
        : d[key].filter((value) => value !== id);
      return { ...d, [key]: ids, [field]: priorities };
    });
  }

  function resetSelections(key: SelectionKey, groupIds?: number[]) {
    setError(null);
    setDraft((d) => {
      if (!d) return d;
      const cleared = new Set(groupIds ?? d[key]);
      const field = PRIORITY_FIELDS[key];
      const priorities = { ...d[field] };
      for (const id of cleared) delete priorities[id];
      return {
        ...d,
        [key]: d[key].filter((id) => !cleared.has(id)),
        [field]: priorities,
      };
    });
  }

  function doImport(sourceBuildId: number) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await importHeroBuild({ heroId, sourceBuildId });
        if (result.error) setError(result.error);
        else {
          closeImport();
          setNotice(result.notice ?? null);
        }
      } catch {
        setError("Could not import the build. Please try again.");
      }
    });
  }

  function submit() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveHeroBuild({
        id: draft.id,
        heroId,
        name: draft.name,
        notes: draft.notes,
        runeAttributeIds: draft.runeIds,
        weaponAttributeIds: draft.weaponIds,
        coreIds: draft.coreIds,
        runePriorities: draft.runePriorities,
        weaponPriorities: draft.weaponPriorities,
        corePriorities: draft.corePriorities,
      });
      if (result.error) setError(result.error);
      else setDraft(null);
    });
  }

  function remove(build: HeroBuild) {
    if (!window.confirm(`Delete the build "${build.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteHeroBuild(build.id);
      if (result.error) setError(result.error);
    });
  }

  const picked = draft
    ? draft.runeIds.length + draft.weaponIds.length + draft.coreIds.length
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {(builds.length > 0 || draft) && <PriorityLegend />}
      {notice && (
        <p role="status" className="text-muted-foreground text-sm">
          {notice}
        </p>
      )}
      {builds.length === 0 && !draft && (
        <p className="text-muted-foreground text-sm">
          No builds recorded for {heroName} yet.
        </p>
      )}

      {builds.map((build) =>
        draft?.id === build.id ? null : (
          <article
            key={build.id}
            className="bg-background flex flex-col gap-6 rounded-lg border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-lg font-semibold">{build.name}</h3>
                {build.notes && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {build.notes}
                  </p>
                )}
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(build)}
                    disabled={pending}
                    aria-label={`Edit ${build.name}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(build)}
                    disabled={pending}
                    aria-label={`Delete ${build.name}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>

            {build.runes.length > 0 && (
              <BuildSection title="Runes">
                {groupRunes(sortByBuildPriority(build.runes)).map(
                  ([type, list]) => (
                    <AttributeGroup key={type} title={runeTypeShort(type)}>
                      {list.map((r) => (
                        <Chip
                          key={r.id}
                          title={r.description}
                          priority={r.priority}
                        >
                          {r.name}
                        </Chip>
                      ))}
                    </AttributeGroup>
                  ),
                )}
              </BuildSection>
            )}
            {build.weapons.length > 0 && (
              <BuildSection title="Weapons">
                <div className="flex flex-wrap gap-1.5">
                  {sortByBuildPriority(build.weapons).map((w) => (
                    <Chip key={w.id} priority={w.priority}>
                      {w.name}
                    </Chip>
                  ))}
                </div>
              </BuildSection>
            )}
            {build.cores.length > 0 && (
              <BuildSection title="Cores">
                <div className="flex flex-wrap gap-1.5">
                  {sortByBuildPriority(build.cores).map((core) => (
                    <Chip
                      key={core.id}
                      title={core.description}
                      priority={core.priority}
                    >
                      {core.name}
                    </Chip>
                  ))}
                </div>
              </BuildSection>
            )}
          </article>
        ),
      )}

      {canEdit &&
        (draft ? (
          <form
            className="bg-background flex flex-col gap-6 rounded-lg border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="build-name">Name</Label>
                <Input
                  id="build-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, name: e.target.value })
                  }
                  placeholder="e.g. Arena frontline"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:row-span-2">
                <Label htmlFor="build-notes">Notes</Label>
                <Textarea
                  id="build-notes"
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, notes: e.target.value })
                  }
                  placeholder="Priorities, what to lock first, trade-offs…"
                  rows={4}
                />
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              Click a chip to cycle: Must have → Should have → OK to have →
              remove.
            </p>

            <BuildSection
              title="Runes"
              onReset={() => resetSelections("runeIds")}
              resetDisabled={pending || draft.runeIds.length === 0}
            >
              {RUNE_TYPES.map((type) => {
                const attributes = runeAttributes.filter(
                  (r) => r.runeType === type,
                );
                return (
                  <AttributeGroup
                    key={type}
                    title={runeTypeShort(type)}
                    onReset={() =>
                      resetSelections(
                        "runeIds",
                        attributes.map((r) => r.id),
                      )
                    }
                    resetDisabled={
                      pending ||
                      !attributes.some((r) => draft.runeIds.includes(r.id))
                    }
                  >
                    {attributes.map((r) => (
                      <Chip
                        key={r.id}
                        priority={draft.runePriorities[r.id]}
                        onClick={() => cyclePriority("runeIds", r.id)}
                        title={[r.description, r.analysis]
                          .filter(Boolean)
                          .join("\n")}
                      >
                        {r.name}
                      </Chip>
                    ))}
                  </AttributeGroup>
                );
              })}
            </BuildSection>
            <BuildSection
              title="Weapons"
              onReset={() => resetSelections("weaponIds")}
              resetDisabled={pending || draft.weaponIds.length === 0}
            >
              <div className="flex flex-wrap gap-1.5">
                {weaponAttributes.map((w) => (
                  <Chip
                    key={w.id}
                    priority={draft.weaponPriorities[w.id]}
                    onClick={() => cyclePriority("weaponIds", w.id)}
                  >
                    {w.name}
                  </Chip>
                ))}
              </div>
            </BuildSection>

            <BuildSection
              title="Cores"
              onReset={() => resetSelections("coreIds")}
              resetDisabled={pending || draft.coreIds.length === 0}
            >
              {cores.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {cores.map((core) => (
                    <Chip
                      key={core.id}
                      priority={draft.corePriorities[core.id]}
                      onClick={() => cyclePriority("coreIds", core.id)}
                      title={core.description}
                    >
                      {core.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No cores recorded for {heroName} yet.
                </p>
              )}
            </BuildSection>

            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={pending || !draft.name.trim() || picked === 0}
              >
                {pending ? "Saving…" : draft.id ? "Save changes" : "Save build"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={cancel}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {error && !importing && (
              <p className="text-destructive text-sm">{error}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={startNew}
                disabled={pending}
                className="w-fit"
              >
                <Plus data-icon="inline-start" /> New build
              </Button>
              <Button
                ref={importButton}
                variant="outline"
                onClick={() => {
                  setError(null);
                  setImporting((v) => !v);
                }}
                disabled={pending}
                aria-expanded={importing}
                aria-controls="hero-build-import"
                className="w-fit"
              >
                <Download data-icon="inline-start" /> Import build
              </Button>
            </div>

            {importing && (
              <HeroBuildImport
                heroId={heroId}
                pending={pending}
                error={error}
                onImport={doImport}
                onCancel={closeImport}
              />
            )}
          </div>
        ))}
    </div>
  );
}

/** Top-level "Runes" / "Weapons" / "Cores" heading for a build's contents. */
function BuildSection({
  title,
  children,
  onReset,
  resetDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-primary bg-primary/10 text-foreground flex items-center justify-between gap-2 rounded-r-md border-l-4 px-3 py-1.5">
        <h4 className="text-base font-bold">{title}</h4>
        {onReset && (
          <ResetButton
            group={title}
            onClick={onReset}
            disabled={resetDisabled}
          />
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function AttributeGroup({
  title,
  children,
  onReset,
  resetDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-primary text-xs font-medium tracking-wide uppercase">
          {title}
        </span>
        {onReset && (
          <ResetButton
            group={`${title} runes`}
            onClick={onReset}
            disabled={resetDisabled}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ResetButton({
  group,
  onClick,
  disabled,
}: {
  group: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Reset ${group}`}
      title={`Clear ${group.toLowerCase()} selections`}
      className="text-muted-foreground"
    >
      <RotateCcw aria-hidden data-icon="inline-start" />
      Reset
    </Button>
  );
}

const PRIORITY_STYLES: Record<BuildPriority, string> = {
  must: "border-amber-500/45 bg-amber-500/10",
  should: "border-sky-500/40 bg-sky-500/10",
  optional: "border-foreground/20 bg-muted/40",
};

function PriorityMarker({ priority }: { priority: BuildPriority }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0",
        priority === "must" &&
          "rotate-45 rounded-[1px] bg-amber-600 dark:bg-amber-400",
        priority === "should" && "rounded-full bg-sky-600 dark:bg-sky-400",
        priority === "optional" &&
          "border-muted-foreground rounded-full border",
      )}
    />
  );
}

function PriorityLegend() {
  return (
    <ul
      aria-label="Attribute priority"
      className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs"
    >
      {BUILD_PRIORITIES.map((priority) => (
        <li key={priority} className="flex items-center gap-2">
          <PriorityMarker priority={priority} />
          {BUILD_PRIORITY_LABELS[priority]}
        </li>
      ))}
    </ul>
  );
}

/** Colors and marker shapes convey tiers; accessible names also spell them out. */
function Chip({
  children,
  priority,
  onClick,
  title,
}: {
  children: string;
  priority?: BuildPriority;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    "inline-flex min-h-7 max-w-full items-center gap-2 rounded-md border px-2 py-1 text-left text-xs leading-4 font-medium";
  const label = priority ? BUILD_PRIORITY_LABELS[priority] : "Not selected";
  const next = nextBuildPriority(priority);
  const action = next ? `Set to ${BUILD_PRIORITY_LABELS[next]}` : "Remove";
  const description = [`${children} — ${label}`, title, onClick ? action : null]
    .filter(Boolean)
    .join("\n");
  const content = (
    <>
      {priority ? (
        <PriorityMarker priority={priority} />
      ) : (
        <Plus className="size-3 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 break-words">{children}</span>
    </>
  );
  if (!onClick) {
    return (
      <span
        className={cn(base, priority && PRIORITY_STYLES[priority])}
        title={description}
        data-priority={priority}
      >
        {content}
        <span className="sr-only">, {label}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={priority !== undefined}
      aria-label={`${children}: ${label}. ${action}`}
      title={description}
      data-priority={priority}
      className={cn(
        base,
        "focus-visible:ring-ring/50 transition-colors focus-visible:ring-3 focus-visible:outline-none",
        priority
          ? PRIORITY_STYLES[priority]
          : "hover:border-primary/60 text-muted-foreground border-dashed bg-transparent",
      )}
    >
      {content}
    </button>
  );
}
