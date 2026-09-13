"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { LINEUP_SIZE, type Fish } from "@/db/schema";
import type { HeroWithDivinities } from "@/lib/heroes";
import type { LineupWithHeroes } from "@/lib/lineups";
import type { LineupSlotInput } from "@/lib/lineup-input";
import type { FishSelection } from "@/lib/fish-selection";
import { createLineupDraft } from "@/lib/lineup-draft";
import type { AssignmentItem } from "@/components/lineup-assignments";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { RoleFilterGroup, type RoleFilter } from "@/components/role-filter";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveLineup } from "../actions";
import { AssignmentPicker } from "./assignment-picker";
import { BuildPicker } from "./build-picker";
import { FishPicker } from "./fish-picker";
import type { HeroBuild } from "@/lib/build-types";

const SLOT_LABELS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"];

export function LineupBuilder({
  heroes,
  pets,
  relics,
  builds,
  fishes,
  preselectSlug,
  lineup,
  cloneFrom,
}: {
  heroes: HeroWithDivinities[];
  pets: AssignmentItem[];
  relics: AssignmentItem[];
  builds: HeroBuild[];
  fishes: Fish[];
  preselectSlug?: string;
  lineup?: LineupWithHeroes;
  cloneFrom?: LineupWithHeroes;
}) {
  const router = useRouter();
  const sourceLineup = lineup ?? cloneFrom;
  const initialDraft = useMemo(
    () => sourceLineup && createLineupDraft(sourceLineup, !lineup),
    [sourceLineup, lineup],
  );
  const [slots, setSlots] = useState<LineupSlotInput[]>(() => {
    if (initialDraft) return initialDraft.slots;
    const initial: LineupSlotInput[] = Array.from(
      { length: LINEUP_SIZE },
      () => null,
    );
    const pre =
      preselectSlug && heroes.find((hero) => hero.slug === preselectSlug);
    if (pre)
      initial[0] = { heroId: pre.id, buildId: null, petIds: [], relicIds: [] };
    return initial;
  });
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [fishSelections, setFishSelections] = useState<FishSelection[]>(
    () => initialDraft?.fishSelections ?? [],
  );
  const [description, setDescription] = useState(
    initialDraft?.description ?? "",
  );
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const heroById = useMemo(
    () =>
      new Map(
        [
          ...heroes,
          ...(sourceLineup?.slots.filter((hero) => hero !== null) ?? []),
        ].map((hero) => [hero.id, hero]),
      ),
    [heroes, sourceLineup],
  );
  const selected = new Set(
    slots.flatMap((slot) => (slot ? [slot.heroId] : [])),
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter(
      (hero) =>
        (role === "all" || hero.role === role) &&
        (!q || hero.name.toLowerCase().includes(q)),
    );
  }, [heroes, query, role]);

  function pickHero(heroId: number) {
    setError(null);
    setSlots((prev) => {
      const existing = prev.findIndex((slot) => slot?.heroId === heroId);
      const next = [...prev];
      if (existing !== -1) {
        if (activeSlot !== null && activeSlot !== existing) {
          // Move the entire assignment with its hero, swapping occupied slots.
          [next[activeSlot], next[existing]] = [
            next[existing],
            next[activeSlot],
          ];
        } else {
          next[existing] = null;
        }
      } else {
        const target = activeSlot ?? prev.indexOf(null);
        if (target === -1) return prev;
        next[target] = { heroId, buildId: null, petIds: [], relicIds: [] };
      }
      return next;
    });
    setActiveSlot(null);
  }

  function clearSlot(index: number) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? null : slot)));
    setError(null);
  }

  function assign(index: number, field: "petIds" | "relicIds", ids: number[]) {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === index && slot ? { ...slot, [field]: ids } : slot,
      ),
    );
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveLineup({
          id: initialDraft?.id,
          name,
          description,
          fishSelections,
          slots,
        });
        if (result?.error) setError(result.error);
        else if (result.id) router.push(`/lineups/${result.id}`);
      } catch {
        setError(
          "Could not save the lineup. Your changes are still here; please try again.",
        );
      }
    });
  }

  const filled = selected.size;

  return (
    <fieldset disabled={pending} className="flex min-w-0 flex-col gap-8">
      <section aria-label="Selected heroes" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Your lineup</h2>
          <span className="text-muted-foreground text-sm">
            {filled}/{LINEUP_SIZE} heroes
          </span>
        </div>
        <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {slots.map((slot, i) => {
            const hero = slot && heroById.get(slot.heroId);
            const active = activeSlot === i;
            return (
              <li
                key={i}
                className={cn(
                  "bg-card flex min-w-0 flex-col gap-2 rounded-lg border p-2 shadow-xs",
                  active && "border-primary ring-primary/30 ring-2",
                )}
              >
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>{SLOT_LABELS[i]}</span>
                  {hero && (
                    <button
                      type="button"
                      onClick={() => clearSlot(i)}
                      aria-label={`Remove ${hero.name}`}
                      className="hover:bg-muted hover:text-foreground rounded p-1"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlot(active ? null : i)}
                  aria-pressed={active}
                  aria-label={`${SLOT_LABELS[i]}${hero ? `: ${hero.name}` : ", empty"}`}
                  className="hover:border-primary/60 focus-visible:ring-ring/50 relative aspect-[81/100] w-full overflow-hidden rounded-md border border-dashed focus-visible:ring-3"
                >
                  {hero ? (
                    <HeroPortrait
                      hero={hero}
                      className="ring-0"
                      sizes="(max-width: 640px) 45vw, 200px"
                    />
                  ) : (
                    <Plus className="text-muted-foreground absolute inset-0 m-auto size-6" />
                  )}
                </button>
                {hero && slot ? (
                  <>
                    <HeroName
                      hero={hero}
                      className="flex min-h-9 items-center justify-center text-center text-sm font-medium"
                    />
                    <div className="flex flex-col gap-2 border-t pt-2">
                      <BuildPicker
                        heroName={hero.name}
                        builds={builds.filter(
                          (build) => build.heroId === hero.id,
                        )}
                        selectedId={slot.buildId}
                        disabled={pending}
                        onChange={(buildId) => {
                          setSlots((prev) =>
                            prev.map((current, index) =>
                              current && index === i
                                ? { ...current, buildId }
                                : current,
                            ),
                          );
                          setError(null);
                        }}
                      />
                      <AssignmentPicker
                        label="Pets"
                        heroName={hero.name}
                        items={pets}
                        selectedIds={slot.petIds}
                        disabled={pending}
                        onChange={(ids) => assign(i, "petIds", ids)}
                      />
                      <AssignmentPicker
                        label="Relics"
                        heroName={hero.name}
                        items={relics}
                        selectedIds={slot.relicIds}
                        disabled={pending}
                        onChange={(ids) => assign(i, "relicIds", ids)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    Choose a hero below
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground text-sm">
          Select pets and relics inside each hero card. You can choose multiple
          of each.
        </p>
      </section>

      <FishPicker
        fishes={fishes}
        selections={fishSelections}
        onChange={(selections) => {
          setFishSelections(selections);
          setError(null);
        }}
        disabled={pending}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <section
          className="flex min-w-0 flex-col gap-4"
          aria-label="Choose heroes"
        >
          <h2 className="font-semibold">Choose heroes</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search heroes…"
                aria-label="Search heroes"
                className="w-56 pl-8"
              />
            </div>
            <div className="max-w-full overflow-x-auto">
              <RoleFilterGroup value={role} onChange={setRole} />
            </div>
          </div>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {activeSlot !== null
              ? `Pick a hero for ${SLOT_LABELS[activeSlot]}. Picking a selected hero swaps its position and assignments.`
              : "Click a hero to add or remove it. Choose a slot above first to replace or move a hero."}
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {visible.map((hero) => {
              const isSelected = selected.has(hero.id);
              return (
                <li key={hero.id}>
                  <button
                    type="button"
                    onClick={() => pickHero(hero.id)}
                    disabled={
                      !isSelected &&
                      filled === LINEUP_SIZE &&
                      activeSlot === null
                    }
                    title={hero.notes || hero.name}
                    aria-pressed={isSelected}
                    className={cn(
                      "bg-card hover:border-primary/60 focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded-lg border p-1 text-left shadow-xs transition-all focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
                      isSelected && "border-primary opacity-50",
                    )}
                  >
                    <HeroPortrait
                      hero={hero}
                      sizes="(max-width: 640px) 33vw, 160px"
                    />
                    <HeroName
                      hero={hero}
                      className="flex min-h-9 w-full items-center justify-center text-center text-xs font-medium"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && (
            <p className="text-muted-foreground py-4 text-sm">
              No heroes match your search.
            </p>
          )}
        </section>

        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Lineup details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lineup-name">Name</Label>
              <Input
                id="lineup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arena anti-mage"
                maxLength={120}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lineup-notes">Why it works</Label>
              <Textarea
                id="lineup-notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Positioning, skill order, what it counters, gear priorities…"
                rows={6}
                maxLength={5000}
              />
            </div>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button
              onClick={submit}
              disabled={pending || filled === 0 || !name.trim()}
              size="lg"
            >
              {pending ? "Saving…" : lineup ? "Save changes" : "Save lineup"}
            </Button>
            <Link
              href={sourceLineup ? `/lineups/${sourceLineup.id}` : "/lineups"}
              className={cn(
                buttonVariants({ variant: "outline" }),
                pending && "pointer-events-none",
              )}
              aria-disabled={pending}
              tabIndex={pending ? -1 : undefined}
            >
              Cancel
            </Link>
          </CardContent>
        </Card>
      </div>
    </fieldset>
  );
}
