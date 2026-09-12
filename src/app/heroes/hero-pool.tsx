"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Hero } from "@/db/schema";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { RoleFilterGroup, type RoleFilter } from "@/components/role-filter";
import { Input } from "@/components/ui/input";

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

      {visible.length === 0 ? (
        <p className="text-muted-foreground">No heroes match.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((hero, i) => (
            <li
              key={hero.id}
              className="bg-card flex flex-col gap-1.5 rounded-lg border p-1.5 shadow-xs"
              title={hero.notes || hero.name}
            >
              <HeroPortrait
                hero={hero}
                sizes="(max-width: 640px) 50vw, 200px"
                priority={i < 8}
              />
              <HeroName
                hero={hero}
                className="min-h-10 px-0.5 text-sm font-medium"
                badgeSize={20}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
