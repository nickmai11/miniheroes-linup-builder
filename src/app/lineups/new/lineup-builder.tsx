"use client";

import { useMemo, useState, useTransition } from "react";
import { HERO_ROLES, LINEUP_SIZE, type Hero } from "@/db/schema";
import { HeroName, HeroPortrait, RoleBadge } from "@/components/hero-portrait";
import { ROLE_LABELS } from "@/lib/hero-labels";
import { saveLineup } from "../actions";

type RoleFilter = Hero["role"] | "all";

const SLOT_LABELS = ["Front 1", "Front 2", "Back 1", "Back 2", "Back 3"];

export function LineupBuilder({ heroes }: { heroes: Hero[] }) {
  const [slots, setSlots] = useState<(number | null)[]>(
    Array.from({ length: LINEUP_SIZE }, () => null),
  );
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
      // Clicking a selected hero removes it from the lineup.
      const existing = prev.indexOf(heroId);
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = null;
        return next;
      }
      const target =
        activeSlot !== null && prev[activeSlot] === null
          ? activeSlot
          : activeSlot !== null
            ? activeSlot
            : prev.indexOf(null);
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
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search heroes…"
            className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
          />
          <div className="flex flex-wrap gap-1">
            {(["all", ...HERO_ROLES] as RoleFilter[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                  role === r
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {r !== "all" && <RoleBadge role={r} size={14} />}
                {r === "all" ? "All" : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          {activeSlot !== null
            ? `Pick a hero for ${SLOT_LABELS[activeSlot]}.`
            : "Click a hero to add it to the next empty slot, or click a slot first to target it."}
        </p>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
          {visible.map((hero, i) => {
            const isSelected = selected.has(hero.id);
            return (
              <li key={hero.id}>
                <button
                  type="button"
                  onClick={() => pickHero(hero.id)}
                  title={hero.notes || hero.name}
                  className={`flex w-full flex-col gap-1 rounded-md p-1 text-left transition ${
                    isSelected
                      ? "bg-neutral-200 opacity-60 dark:bg-neutral-800"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`}
                >
                  <HeroPortrait
                    hero={hero}
                    sizes="(max-width: 640px) 25vw, 120px"
                    priority={i < 7}
                  />
                  <HeroName
                    hero={hero}
                    className="text-xs font-medium"
                    badgeSize={16}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
        <h2 className="font-medium">
          Lineup{" "}
          <span className="text-sm font-normal text-neutral-500">
            {filled}/{LINEUP_SIZE}
          </span>
        </h2>
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-3">
          {slots.map((heroId, i) => {
            const hero = heroId === null ? null : heroById.get(heroId);
            const active = activeSlot === i;
            return (
              <div key={i} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveSlot(active ? null : i)}
                  className={`relative aspect-[81/100] w-full rounded-md border-2 border-dashed ${
                    active
                      ? "border-black dark:border-white"
                      : "border-neutral-300 dark:border-neutral-700"
                  }`}
                  aria-label={`${SLOT_LABELS[i]}${hero ? `: ${hero.name}` : ", empty"}`}
                >
                  {hero ? (
                    <HeroPortrait
                      hero={hero}
                      className="border-0"
                      sizes="96px"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-xl text-neutral-400">
                      +
                    </span>
                  )}
                </button>
                <span className="truncate text-center text-[10px] text-neutral-500">
                  {hero ? hero.name : SLOT_LABELS[i]}
                </span>
                {hero && (
                  <button
                    type="button"
                    onClick={() => clearSlot(i)}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lineup name (e.g. Arena anti-mage)"
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why this works: positioning, skill order, what it counters, gear priorities…"
          rows={6}
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={pending || filled === 0 || !name.trim()}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Saving…" : "Save lineup"}
        </button>
      </aside>
    </div>
  );
}
