"use client";

import { useI18n } from "@/lib/i18n/client";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { RoleFilterGroup, type RoleFilter } from "@/components/role-filter";
import { Input } from "@/components/ui/input";
import type { HeroWithDivinities } from "@/lib/heroes";

export function HeroPool({ heroes }: { heroes: HeroWithDivinities[] }) {
  const { t } = useI18n();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes
      .filter(
        (h) =>
          (role === "all" || h.role === role) &&
          (!q || h.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => Number(b.hasBuild) - Number(a.hasBuild));
  }, [heroes, query, role]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search heroes…")}
            aria-label={t("Search heroes")}
            className="w-56 pl-8"
          />
        </div>
        <RoleFilterGroup value={role} onChange={setRole} />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">{t("No heroes match.")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((hero, i) => (
            <li key={hero.id}>
              <Link
                href={`/heroes/${hero.slug}`}
                title={hero.notes || hero.name}
                className="bg-card hover:border-primary/60 flex flex-col gap-1.5 rounded-lg border p-1.5 shadow-xs transition-colors"
              >
                <HeroPortrait
                  hero={hero}
                  divinities={hero.divinities}
                  sizes="(max-width: 640px) 50vw, 200px"
                  priority={i < 8}
                  divinitySize={32}
                />
                <HeroName
                  hero={hero}
                  className="flex min-h-10 w-full items-center justify-center px-0.5 text-center text-sm font-medium"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
