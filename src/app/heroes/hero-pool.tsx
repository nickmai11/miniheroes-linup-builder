"use client";

import { matchesGameLabel } from "@/lib/i18n/game-labels";
import { Tabs } from "@base-ui/react/tabs";
import {
  getHeroReleaseStatus,
  type HeroReleaseStatus,
} from "@/data/hero-release-status";
import { useI18n } from "@/lib/i18n/client";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { RoleFilterGroup, type RoleFilter } from "@/components/role-filter";
import { Input } from "@/components/ui/input";
import type { HeroWithDivinities } from "@/lib/heroes";

export function HeroPool({ heroes }: { heroes: HeroWithDivinities[] }) {
  const { gameLabel, t } = useI18n();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [releaseStatus, setReleaseStatus] =
    useState<HeroReleaseStatus>("released");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes
      .filter(
        (h) =>
          getHeroReleaseStatus(h.slug) === releaseStatus &&
          (role === "all" || h.role === role) &&
          (!q || matchesGameLabel("hero", h, q)),
      )
      .sort((a, b) => Number(b.hasBuild) - Number(a.hasBuild));
  }, [heroes, query, role, releaseStatus]);

  return (
    <Tabs.Root
      value={releaseStatus}
      onValueChange={(value) => {
        if (value === "released" || value === "unreleased")
          setReleaseStatus(value);
      }}
      className="flex flex-col gap-6"
    >
      <Tabs.List
        aria-label={t("Hero release status")}
        className="flex gap-1 border-b"
      >
        {(["released", "unreleased"] as const).map((status) => (
          <Tabs.Tab
            key={status}
            value={status}
            className="text-muted-foreground hover:text-foreground data-active:border-primary data-active:text-foreground focus-visible:ring-ring border-b-2 border-transparent px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2"
          >
            {t(status === "released" ? "Released" : "Unreleased")}
          </Tabs.Tab>
        ))}
      </Tabs.List>
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

      {(["released", "unreleased"] as const).map((status) => (
        <Tabs.Panel key={status} value={status}>
          {releaseStatus === status &&
            (visible.length === 0 ? (
              <p className="text-muted-foreground">{t("No heroes match.")}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {visible.map((hero, i) => (
                  <li key={hero.id}>
                    <Link
                      href={`/heroes/${hero.slug}`}
                      title={hero.notes || gameLabel("hero", hero)}
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
            ))}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
