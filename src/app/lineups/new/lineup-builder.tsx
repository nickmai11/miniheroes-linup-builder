"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { LINEUP_SIZE } from "@/db/schema";
import type { HeroWithDivinities } from "@/lib/heroes";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { RoleFilterGroup, type RoleFilter } from "@/components/role-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveLineup } from "../actions";

const SLOT_LABELS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"];

export function LineupBuilder({
  heroes,
  preselectSlug,
}: {
  heroes: HeroWithDivinities[];
  preselectSlug?: string;
}) {
  const [slots, setSlots] = useState<(number | null)[]>(() => {
    const initial: (number | null)[] = Array.from(
      { length: LINEUP_SIZE },
      () => null,
    );
    const pre = preselectSlug && heroes.find((h) => h.slug === preselectSlug);
    if (pre) initial[0] = pre.id;
    return initial;
  });
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const heroById = useMemo(
    () => new Map(heroes.map((h) => [h.id, h])),
    [heroes],
  );
  const selected = new Set(slots.filter((id): id is number => id !== null));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter(
      (h) =>
        (role === "all" || h.role === role) &&
        (!q || h.name.toLowerCase().includes(q)),
    );
  }, [heroes, query, role]);

  function pickHero(heroId: number) {
    setError(null);
    setSlots((prev) => {
      const existing = prev.indexOf(heroId);
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = null;
        return next;
      }
      const target = activeSlot ?? prev.indexOf(null);
      if (target === -1) return prev;
      const next = [...prev];
      next[target] = heroId;
      return next;
    });
    if (activeSlot !== null) setActiveSlot(null);
  }

  function clearSlot(index: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveLineup({ name, description, slots });
      if (result?.error) setError(result.error);
    });
  }

  const filled = slots.filter((s) => s !== null).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search heroes…"
              className="w-56 pl-8"
            />
          </div>
          <RoleFilterGroup value={role} onChange={setRole} />
        </div>
        <p className="text-muted-foreground text-sm">
          {activeSlot !== null
            ? `Pick a hero for ${SLOT_LABELS[activeSlot]}.`
            : "Click a hero to add it to the next empty slot, or click a slot first to target it. Click a selected hero to remove it."}
        </p>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
          {visible.map((hero) => {
            const isSelected = selected.has(hero.id);
            return (
              <li key={hero.id}>
                <button
                  type="button"
                  onClick={() => pickHero(hero.id)}
                  title={hero.notes || hero.name}
                  aria-pressed={isSelected}
                  className={cn(
                    "bg-card hover:border-primary/60 focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded-lg border p-1 text-left shadow-xs transition-all focus-visible:ring-3 focus-visible:outline-none",
                    isSelected && "border-primary opacity-50",
                  )}
                >
                  <HeroPortrait
                    hero={hero}
                    divinities={hero.divinities}
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
      </section>

      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-baseline justify-between">
            Lineup
            <span className="text-muted-foreground text-sm font-normal">
              {filled}/{LINEUP_SIZE}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-3">
            {slots.map((heroId, i) => {
              const hero = heroId === null ? null : heroById.get(heroId);
              const active = activeSlot === i;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSlot(active ? null : i)}
                    aria-label={`${SLOT_LABELS[i]}${hero ? `: ${hero.name}` : ", empty"}`}
                    className={cn(
                      "relative aspect-[81/100] w-full overflow-hidden rounded-md border-2 border-dashed transition-colors",
                      active
                        ? "border-primary"
                        : "border-border hover:border-primary/60",
                    )}
                  >
                    {hero ? (
                      <HeroPortrait
                        hero={hero}
                        divinities={hero.divinities}
                        className="ring-0"
                        sizes="110px"
                      />
                    ) : (
                      <Plus className="text-muted-foreground absolute inset-0 m-auto size-5" />
                    )}
                  </button>
                  <div className="text-muted-foreground flex items-center justify-between gap-1 px-0.5 text-xs">
                    <span className="truncate">
                      {hero ? hero.name : SLOT_LABELS[i]}
                    </span>
                    {hero && (
                      <button
                        type="button"
                        onClick={() => clearSlot(i)}
                        aria-label={`Remove ${hero.name}`}
                        className="hover:bg-muted hover:text-foreground rounded p-0.5"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lineup-name">Name</Label>
            <Input
              id="lineup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arena anti-mage"
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
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            onClick={submit}
            disabled={pending || filled === 0 || !name.trim()}
            size="lg"
          >
            {pending ? "Saving…" : "Save lineup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
