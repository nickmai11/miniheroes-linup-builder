"use client";

import { Fish as FishSymbol, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FishStats } from "@/components/fish-stats";
import { FishBait } from "@/components/fish-bait";
import type { Fish } from "@/db/schema";
import { versioned } from "@/lib/asset-version";
import { FISH_CATEGORIES } from "@/lib/fish-selection";
import { useI18n } from "@/lib/i18n/client";
import { matchesGameLabel } from "@/lib/i18n/game-labels";

export function FishCatalog({ fishes }: { fishes: Fish[] }) {
  const { gameLabel, t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [area, setArea] = useState("all");
  const areas = [...new Set(fishes.map((fish) => fish.area).filter(Boolean))];
  const visible = fishes
    .filter(
      (fish) =>
        (category === "all" || fish.fishType === category) &&
        (area === "all" || fish.area === area) &&
        matchesGameLabel("fish", fish, query),
    )
    .sort(
      (a, b) =>
        Number(b.specialStats.length > 0) - Number(a.specialStats.length > 0) ||
        a.name.localeCompare(b.name),
    );
  const filtered = query !== "" || category !== "all" || area !== "all";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:w-64">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search fishes…")}
            aria-label={t("Search fishes")}
            className="h-10 pl-9"
          />
        </div>
        <label className="flex flex-1 flex-col gap-1 text-xs sm:flex-none">
          <span className="text-muted-foreground">{t("Category")}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="bg-background border-input focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2"
          >
            <option value="all">{t("All categories")}</option>
            {FISH_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs sm:flex-none">
          <span className="text-muted-foreground">{t("Fishing area")}</span>
          <select
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className="bg-background border-input focus-visible:ring-ring h-10 max-w-full rounded-md border px-3 text-sm focus-visible:ring-2"
          >
            <option value="all">{t("All areas")}</option>
            {areas.map((value) => (
              <option key={value} value={value}>
                {gameLabel("fishArea", value)}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <Button
            variant="ghost"
            className="h-10"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setArea("all");
            }}
          >
            {t("Clear filters")}
          </Button>
        )}
      </div>

      <p role="status" className="text-muted-foreground text-sm">
        {t("{count} of {total} fishes", {
          count: visible.length,
          total: fishes.length,
        })}
      </p>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {fishes.length
            ? t("No fishes match your filters.")
            : t("No fishes recorded yet.")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((fish) => (
            <li
              key={fish.id}
              className="bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                {fish.iconUrl ? (
                  <Image
                    src={versioned(fish.iconUrl)}
                    alt={gameLabel("fish", fish)}
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-full">
                    <FishSymbol aria-hidden className="size-8" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base leading-snug font-semibold break-words">
                    {gameLabel("fish", fish)}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t(fish.fishType)}
                  </p>
                </div>
              </div>
              <dl className="flex flex-1 flex-col gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1.5 text-xs">
                    {t("Base stats")}
                  </dt>
                  <dd>
                    <FishStats stats={fish.baseStats} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1.5 text-xs">
                    {t("Special stats")}
                  </dt>
                  <dd>
                    <FishStats stats={fish.specialStats} special />
                  </dd>
                </div>
                <div className="mt-auto border-t pt-3">
                  <dt className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                    <MapPin aria-hidden className="size-3.5" />
                    {t("Where to get it")}
                  </dt>
                  <dd>
                    {fish.area
                      ? gameLabel("fishArea", fish.area)
                      : t("Location not recorded yet.")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">{t("Bait")}</dt>
                  <dd>
                    <FishBait name={fish.bait} />
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
