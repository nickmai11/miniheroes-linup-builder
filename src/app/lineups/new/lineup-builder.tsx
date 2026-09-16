"use client";

import { matchesGameLabel } from "@/lib/i18n/game-labels";
import { useI18n } from "@/lib/i18n/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
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
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineupVisibilityToggle } from "@/components/lineup-visibility";
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
  const { gameLabel, t } = useI18n();

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
  const heroPoolId = useId();
  const slotTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [isPrivate, setIsPrivate] = useState(initialDraft?.isPrivate ?? false);
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
        (!q || matchesGameLabel("hero", hero, q)),
    );
  }, [heroes, query, role]);

  function pickHero(heroId: number) {
    if (activeSlot === null || pending) return;
    setError(null);
    setSlots((prev) => {
      const existing = prev.findIndex((slot) => slot?.heroId === heroId);
      const next = [...prev];
      if (existing !== -1) {
        if (activeSlot !== existing) {
          // Move the entire assignment with its hero, swapping occupied slots.
          [next[activeSlot], next[existing]] = [
            next[existing],
            next[activeSlot],
          ];
        }
      } else {
        next[activeSlot] = { heroId, buildId: null, petIds: [], relicIds: [] };
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
          isPrivate,
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
      <section
        aria-label={t("Selected heroes")}
        className="flex flex-col gap-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">{t("Your lineup")}</h2>
          <span className="text-muted-foreground text-sm">
            {filled}/{LINEUP_SIZE} {t("heroes")}
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
                  <span>{t(SLOT_LABELS[i])}</span>
                  {hero && (
                    <button
                      type="button"
                      onClick={() => clearSlot(i)}
                      aria-label={t("Remove {name}", {
                        name: gameLabel("hero", hero),
                      })}
                      className="hover:bg-muted hover:text-foreground rounded p-1"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    slotTriggerRef.current = event.currentTarget;
                    setQuery("");
                    setRole("all");
                    setActiveSlot(i);
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={active}
                  aria-controls={active ? heroPoolId : undefined}
                  aria-label={t("{slot}: {hero}", {
                    slot: t(SLOT_LABELS[i]),
                    hero: hero ? gameLabel("hero", hero) : t("Empty"),
                  })}
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
                        heroName={gameLabel("hero", hero)}
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
                        heroName={gameLabel("hero", hero)}
                        items={pets}
                        selectedIds={slot.petIds}
                        disabled={pending}
                        onChange={(ids) => assign(i, "petIds", ids)}
                      />
                      <AssignmentPicker
                        label="Relics"
                        heroName={gameLabel("hero", hero)}
                        items={relics}
                        selectedIds={slot.relicIds}
                        disabled={pending}
                        onChange={(ids) => assign(i, "relicIds", ids)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    {t("Click the slot to choose a hero")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground text-sm">
          {t(
            "Select pets and relics inside each hero card. You can choose multiple of each.",
          )}
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

      <Dialog.Root
        open={activeSlot !== null}
        onOpenChange={(open) => {
          if (!open) setActiveSlot(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup
              id={heroPoolId}
              finalFocus={slotTriggerRef}
              className="bg-background flex h-[min(48rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-xl border shadow-2xl outline-none"
            >
              <div className="flex shrink-0 flex-col gap-3 border-b p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <Dialog.Title className="font-heading text-xl font-semibold">
                    {t("Choose heroes")}
                    {activeSlot !== null && ` · ${t(SLOT_LABELS[activeSlot])}`}
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label={t("Close heroes")}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="text-muted-foreground text-sm">
                  {activeSlot !== null &&
                    t(
                      "Pick a hero for {slot}. Picking a selected hero swaps its position and assignments.",
                      { slot: t(SLOT_LABELS[activeSlot]) },
                    )}
                </Dialog.Description>
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Search heroes…")}
                    aria-label={t("Search heroes")}
                    className="w-full pl-8"
                  />
                </div>
                <div className="max-w-full overflow-x-auto">
                  <RoleFilterGroup value={role} onChange={setRole} />
                </div>
              </div>
              <div className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain p-4 sm:p-6">
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {visible.map((hero) => {
                    const isSelected = selected.has(hero.id);
                    return (
                      <li key={hero.id}>
                        <button
                          type="button"
                          onClick={() => pickHero(hero.id)}
                          disabled={pending}
                          title={hero.notes || gameLabel("hero", hero)}
                          aria-pressed={isSelected}
                          className={cn(
                            "bg-card hover:border-primary/60 focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded-lg border p-1 text-left shadow-xs transition-all focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
                            isSelected && "border-primary opacity-50",
                          )}
                        >
                          <HeroPortrait
                            hero={hero}
                            sizes="(max-width: 640px) 30vw, 160px"
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
                  <p
                    className="text-muted-foreground py-4 text-sm"
                    role="status"
                  >
                    {t("No heroes match your search.")}
                  </p>
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      <Card>
        <CardHeader>
          <CardTitle>{t("Lineup details")}</CardTitle>
          <CardAction>
            <LineupVisibilityToggle
              isPrivate={isPrivate}
              onChange={setIsPrivate}
              disabled={pending}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lineup-name">{t("Name")}</Label>
            <Input
              id="lineup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Arena anti-mage")}
              maxLength={120}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lineup-notes">{t("Why it works")}</Label>
            <Textarea
              id="lineup-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(
                "Positioning, skill order, what it counters, gear priorities…",
              )}
              rows={6}
              maxLength={5000}
            />
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {t(error)}
            </p>
          )}
          {filled < LINEUP_SIZE && (
            <p className="text-muted-foreground text-sm">
              {t("Pick all five heroes before saving")}
            </p>
          )}
          <Button
            onClick={submit}
            disabled={pending || filled !== LINEUP_SIZE || !name.trim()}
            size="lg"
          >
            {pending
              ? t("Saving…")
              : lineup
                ? t("Save changes")
                : t("Save lineup")}
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
            {t("Cancel")}
          </Link>
        </CardContent>
      </Card>
    </fieldset>
  );
}
