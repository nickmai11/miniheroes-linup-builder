"use client";

import { useMemo, useState } from "react";
import { HERO_ROLES, type Hero } from "@/db/schema";
import { HeroName, HeroPortrait, RoleBadge } from "@/components/hero-portrait";
import { ROLE_LABELS } from "@/lib/hero-labels";

type RoleFilter = Hero["role"] | "all";

export function HeroPool({ heroes }: { heroes: Hero[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter(
      (h) =>
        (role === "all" || h.role === role) &&
        (!q || h.name.toLowerCase().includes(q)),
    );
  }, [heroes, query, role]);

  return (
    <div className="flex flex-col gap-6">
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

      {visible.length === 0 ? (
        <p className="text-neutral-500">No heroes match.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {visible.map((hero, i) => (
            <li
              key={hero.id}
              className="flex flex-col gap-1 rounded-md p-1"
              title={hero.notes || hero.name}
            >
              <HeroPortrait
                hero={hero}
                sizes="(max-width: 640px) 33vw, 160px"
                priority={i < 6}
              />
              <HeroName
                hero={hero}
                className="text-sm font-medium"
                badgeSize={20}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
