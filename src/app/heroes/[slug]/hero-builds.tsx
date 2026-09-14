"use client";

import { useI18n } from "@/lib/i18n/client";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RUNE_TYPES,
  type RuneAttribute,
  type WeaponAttribute,
} from "@/db/schema";
import type { CoreWithSkill, HeroBuild } from "@/lib/build-types";
import {
  DEFAULT_BUILD_PRIORITY,
  nextBuildPriority,
  type BuildPriority,
} from "@/lib/build-priorities";
import {
  deleteHeroBuild,
  importHeroBuild,
  saveHeroBuild,
} from "./build-actions";
import {
  AttributeGroup,
  BuildPlaceholder,
  BuildSection,
  BuildStats,
  Chip,
  PriorityLegend,
  runeTypeShort,
} from "@/components/build-stats";
import { CoreDetails } from "@/components/core-popover";
import { BuildPopover } from "@/components/build-popover";
import { HeroBuildImport } from "./hero-build-import";

type Props = {
  canEdit: boolean;
  heroId: number;
  heroName: string;
  builds: HeroBuild[];
  runeAttributes: RuneAttribute[];
  weaponAttributes: WeaponAttribute[];
  cores: CoreWithSkill[];
};

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

export function HeroBuilds({
  canEdit,
  heroId,
  heroName,
  builds,
  runeAttributes,
  weaponAttributes,
  cores,
}: Props) {
  const { t } = useI18n();

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
    if (!window.confirm(t('Delete the build "{name}"?', { name: build.name })))
      return;
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
          {notice.startsWith(
            "Build imported. Cores not recorded for this hero were skipped: ",
          )
            ? t(
                "Build imported. Cores not recorded for this hero were skipped: {cores}.",
                {
                  cores: notice.slice(
                    "Build imported. Cores not recorded for this hero were skipped: "
                      .length,
                    -1,
                  ),
                },
              )
            : t(notice)}
        </p>
      )}
      {builds.length === 0 && !draft && (
        <p className="text-muted-foreground text-sm">
          {t("No builds recorded for {name} yet.", { name: heroName })}
        </p>
      )}

      {builds.map((build) =>
        draft?.id === build.id ? null : (
          <article
            key={build.id}
            className="bg-background flex flex-col gap-8 rounded-lg border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-lg font-semibold">
                  <BuildPopover
                    build={build}
                    trigger={
                      <button type="button" className="text-left">
                        {build.name}
                      </button>
                    }
                  />
                </h3>
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
                    aria-label={t("Edit {name}", { name: build.name })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(build)}
                    disabled={pending}
                    aria-label={t("Delete {name}", { name: build.name })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>

            <BuildStats build={build} />
          </article>
        ),
      )}

      {canEdit &&
        (draft ? (
          <form
            className="bg-background flex flex-col gap-8 rounded-lg border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="build-name">{t("Name")}</Label>
                <Input
                  id="build-name"
                  maxLength={120}
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, name: e.target.value })
                  }
                  placeholder={t("e.g. Arena frontline")}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:row-span-2">
                <Label htmlFor="build-notes">{t("Notes")}</Label>
                <Textarea
                  id="build-notes"
                  maxLength={5000}
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, notes: e.target.value })
                  }
                  placeholder={t("Priorities, what to lock first, trade-offs…")}
                  rows={4}
                />
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              {t("Click a chip to change its priority or remove it.")}
            </p>

            <BuildSection
              title={t("Runes")}
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
                    {attributes.length === 0 && (
                      <BuildPlaceholder>
                        {t("No attributes available.")}
                      </BuildPlaceholder>
                    )}
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
              title={t("Weapons")}
              onReset={() => resetSelections("weaponIds")}
              resetDisabled={pending || draft.weaponIds.length === 0}
            >
              {weaponAttributes.length === 0 && (
                <BuildPlaceholder>
                  {t("No weapon attributes available.")}
                </BuildPlaceholder>
              )}
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
              title={t("Cores")}
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
                      popover={<CoreDetails core={core} />}
                    >
                      {core.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <BuildPlaceholder>
                  {t("No cores recorded for {name} yet.", { name: heroName })}
                </BuildPlaceholder>
              )}
            </BuildSection>

            {error && <p className="text-destructive text-sm">{t(error)}</p>}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={pending || !draft.name.trim() || picked === 0}
              >
                {pending
                  ? t("Saving…")
                  : draft.id
                    ? t("Save changes")
                    : t("Save build")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={cancel}
                disabled={pending}
              >
                {t("Cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {error && !importing && (
              <p className="text-destructive text-sm">{t(error)}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={startNew}
                disabled={pending}
                className="w-fit"
              >
                <Plus data-icon="inline-start" /> {t("New build")}
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
                <Download data-icon="inline-start" /> {t("Import build")}
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
