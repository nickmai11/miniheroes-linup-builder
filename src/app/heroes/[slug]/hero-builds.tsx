"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
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
import { RUNE_TYPE_LABELS, formatMaxValue } from "@/lib/hero-labels";
import { cn } from "@/lib/utils";
import { deleteHeroBuild, saveHeroBuild } from "./build-actions";

type Props = {
  heroId: number;
  heroName: string;
  builds: HeroBuild[];
  runeAttributes: RuneAttribute[];
  weaponAttributes: WeaponAttribute[];
};

type Draft = {
  id?: number;
  name: string;
  notes: string;
  runeIds: Set<number>;
  weaponIds: Set<number>;
};

function draftFrom(build?: HeroBuild): Draft {
  return {
    id: build?.id,
    name: build?.name ?? "",
    notes: build?.notes ?? "",
    runeIds: new Set(build?.runes.map((r) => r.id) ?? []),
    weaponIds: new Set(build?.weapons.map((w) => w.id) ?? []),
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startNew() {
    setError(null);
    setDraft(draftFrom());
  }
  function startEdit(build: HeroBuild) {
    setError(null);
    setDraft(draftFrom(build));
  }
  function cancel() {
    setDraft(null);
    setError(null);
  }

  function toggle(key: "runeIds" | "weaponIds", id: number) {
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d[key]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...d, [key]: next };
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
        runeAttributeIds: [...draft.runeIds],
        weaponAttributeIds: [...draft.weaponIds],
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

  const picked = draft ? draft.runeIds.size + draft.weaponIds.size : 0;

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

            {groupRunes(build.runes).map(([type, list]) => (
              <AttributeGroup key={type} title={RUNE_TYPE_LABELS[type]}>
                {list.map((r) => (
                  <Chip key={r.id} title={r.description}>
                    {r.name}
                    <span className="text-muted-foreground">
                      {formatMaxValue(r)}
                    </span>
                  </Chip>
                ))}
              </AttributeGroup>
            ))}
            {build.weapons.length > 0 && (
              <AttributeGroup title="Weapons">
                {build.weapons.map((w) => (
                  <Chip key={w.id}>{w.name}</Chip>
                ))}
              </AttributeGroup>
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
            Click an attribute to add it to the build; click again to remove it.
          </p>

          {RUNE_TYPES.map((type) => (
            <AttributeGroup key={type} title={RUNE_TYPE_LABELS[type]}>
              {runeAttributes
                .filter((r) => r.runeType === type)
                .map((r) => (
                  <Chip
                    key={r.id}
                    pressed={draft.runeIds.has(r.id)}
                    onClick={() => toggle("runeIds", r.id)}
                    title={[r.description, r.analysis]
                      .filter(Boolean)
                      .join("\n")}
                  >
                    {r.name}
                    <span className="text-muted-foreground">
                      {formatMaxValue(r)}
                    </span>
                  </Chip>
                ))}
            </AttributeGroup>
          ))}
          <AttributeGroup title="Weapons">
            {weaponAttributes.map((w) => (
              <Chip
                key={w.id}
                pressed={draft.weaponIds.has(w.id)}
                onClick={() => toggle("weaponIds", w.id)}
              >
                {w.name}
              </Chip>
            ))}
          </AttributeGroup>

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
        <div className="flex flex-col gap-2">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            variant="outline"
            onClick={startNew}
            disabled={pending}
            className="w-fit"
          >
            <Plus data-icon="inline-start" /> New build
          </Button>
        </div>
      )}
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

/** An attribute pill; interactive (toggle) when `onClick` is given. */
function Chip({
  children,
  pressed,
  onClick,
  title,
}: {
  children: React.ReactNode;
  pressed?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap";
  if (!onClick) {
    return (
      <span className={cn(base, "bg-muted/40")} title={title}>
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
      {children}
    </button>
  );
}
