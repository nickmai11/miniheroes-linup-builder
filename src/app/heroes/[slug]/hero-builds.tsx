"use client";

import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RUNE_TYPES,
  type RuneAttribute,
  type RuneType,
  type WeaponAttribute,
} from "@/db/schema";
import type { HeroBuild } from "@/lib/build-types";
import { RUNE_TYPE_LABELS } from "@/lib/hero-labels";
import { cn } from "@/lib/utils";
import {
  deleteHeroBuild,
  importHeroBuild,
  saveHeroBuild,
} from "./build-actions";
import { HeroBuildImport } from "./hero-build-import";

type Props = {
  heroId: number;
  heroName: string;
  builds: HeroBuild[];
  runeAttributes: RuneAttribute[];
  weaponAttributes: WeaponAttribute[];
};

/** Rune-type label without the trailing " Runes" (shown under a Runes section). */
function runeTypeShort(type: RuneType) {
  return RUNE_TYPE_LABELS[type].replace(/ Runes$/, "");
}

/** Ids are kept in pick order: first picked = most important = shown first. */
type Draft = {
  id?: number;
  name: string;
  notes: string;
  runeIds: number[];
  weaponIds: number[];
};

function draftFrom(build?: HeroBuild): Draft {
  return {
    id: build?.id,
    name: build?.name ?? "",
    notes: build?.notes ?? "",
    runeIds: build?.runes.map((r) => r.id) ?? [],
    weaponIds: build?.weapons.map((w) => w.id) ?? [],
  };
}

function groupRunes(runes: RuneAttribute[]): [RuneType, RuneAttribute[]][] {
  return RUNE_TYPES.flatMap((t) => {
    const list = runes.filter((r) => r.runeType === t);
    return list.length > 0 ? [[t, list] as [RuneType, RuneAttribute[]]] : [];
  });
}

export function HeroBuilds({
  heroId,
  heroName,
  builds,
  runeAttributes,
  weaponAttributes,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setImporting(false);
    setDraft(draftFrom());
  }
  function startEdit(build: HeroBuild) {
    setError(null);
    setImporting(false);
    setDraft(draftFrom(build));
  }
  function cancel() {
    setDraft(null);
    setError(null);
  }

  function toggle(key: "runeIds" | "weaponIds", id: number) {
    setDraft((d) => {
      if (!d) return d;
      const next = d[key].includes(id)
        ? d[key].filter((x) => x !== id)
        : [...d[key], id];
      return { ...d, [key]: next };
    });
  }

  /** 1-based priority of a picked rune among the picked runes of its type. */
  function runeRank(d: Draft, rune: RuneAttribute) {
    const sameType = d.runeIds.filter(
      (id) => runeById.get(id)?.runeType === rune.runeType,
    );
    const i = sameType.indexOf(rune.id);
    return i === -1 ? null : i + 1;
  }

  function doImport(sourceBuildId: number) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await importHeroBuild({ heroId, sourceBuildId });
        if (result.error) setError(result.error);
        else closeImport();
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

  const picked = draft ? draft.runeIds.length + draft.weaponIds.length : 0;
  const runeById = new Map(runeAttributes.map((r) => [r.id, r]));

  return (
    <div className="flex flex-col gap-4">
      {builds.length === 0 && !draft && (
        <p className="text-muted-foreground text-sm">
          No builds recorded for {heroName} yet.
        </p>
      )}

      {builds.map((build) =>
        draft?.id === build.id ? null : (
          <article
            key={build.id}
            className="bg-background flex flex-col gap-3 rounded-lg border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="font-medium">{build.name}</h3>
                {build.notes && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {build.notes}
                  </p>
                )}
              </div>
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
            </div>

            {build.runes.length > 0 && (
              <BuildSection title="Runes">
                {groupRunes(build.runes).map(([type, list]) => (
                  <AttributeGroup key={type} title={runeTypeShort(type)}>
                    {list.map((r, i) => (
                      <Chip key={r.id} title={r.description} rank={i + 1}>
                        {r.name}
                      </Chip>
                    ))}
                  </AttributeGroup>
                ))}
              </BuildSection>
            )}
            {build.weapons.length > 0 && (
              <BuildSection title="Weapons">
                <div className="flex flex-wrap gap-1.5">
                  {build.weapons.map((w, i) => (
                    <Chip key={w.id} rank={i + 1}>
                      {w.name}
                    </Chip>
                  ))}
                </div>
              </BuildSection>
            )}
          </article>
        ),
      )}

      {draft ? (
        <form
          className="bg-background flex flex-col gap-4 rounded-lg border p-3"
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
            Click attributes in order of importance: the first one you click is
            shown first. Click again to remove.
          </p>

          <BuildSection title="Runes">
            {RUNE_TYPES.map((type) => (
              <AttributeGroup key={type} title={runeTypeShort(type)}>
                {runeAttributes
                  .filter((r) => r.runeType === type)
                  .map((r) => (
                    <Chip
                      key={r.id}
                      pressed={draft.runeIds.includes(r.id)}
                      rank={runeRank(draft, r)}
                      onClick={() => toggle("runeIds", r.id)}
                      title={[r.description, r.analysis]
                        .filter(Boolean)
                        .join("\n")}
                    >
                      {r.name}
                    </Chip>
                  ))}
              </AttributeGroup>
            ))}
          </BuildSection>
          <BuildSection title="Weapons">
            <div className="flex flex-wrap gap-1.5">
              {weaponAttributes.map((w) => (
                <Chip
                  key={w.id}
                  pressed={draft.weaponIds.includes(w.id)}
                  rank={
                    draft.weaponIds.includes(w.id)
                      ? draft.weaponIds.indexOf(w.id) + 1
                      : null
                  }
                  onClick={() => toggle("weaponIds", w.id)}
                >
                  {w.name}
                </Chip>
              ))}
            </div>
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
      )}
    </div>
  );
}

/** Top-level "Runes" / "Weapons" heading for a build's contents. */
function BuildSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{title}</span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function AttributeGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-primary text-xs font-medium tracking-wide uppercase">
        {title}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * An attribute pill; interactive (toggle) when `onClick` is given. `rank` is
 * the 1-based priority shown as a small number at the front.
 */
function Chip({
  children,
  pressed,
  onClick,
  title,
  rank,
}: {
  children: React.ReactNode;
  pressed?: boolean;
  onClick?: () => void;
  title?: string;
  rank?: number | null;
}) {
  const base =
    "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap";
  const badge = rank ? (
    <span className="bg-primary text-primary-foreground -ml-1 inline-flex size-4 items-center justify-center rounded-full text-[10px] leading-none font-semibold tabular-nums">
      {rank}
    </span>
  ) : null;
  if (!onClick) {
    return (
      <span className={cn(base, "bg-muted/40")} title={title}>
        {badge}
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={title}
      className={cn(
        base,
        "focus-visible:ring-ring/50 transition-colors focus-visible:ring-3 focus-visible:outline-none",
        pressed
          ? "border-primary bg-primary/15 text-foreground"
          : "hover:border-primary/60 text-muted-foreground bg-transparent",
      )}
    >
      {badge}
      {children}
    </button>
  );
}
