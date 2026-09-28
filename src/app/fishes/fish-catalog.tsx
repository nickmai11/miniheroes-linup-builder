"use client";

import { Fish as FishSymbol, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FishStats } from "@/components/fish-stats";
import { FishBait } from "@/components/fish-bait";
import { FishRarity } from "@/components/fish-rarity";
import type { Fish } from "@/db/schema";
import { versioned } from "@/lib/asset-version";
import { FISH_CATEGORIES } from "@/lib/fish-selection";
import { useI18n } from "@/lib/i18n/client";
import { matchesFishFilters } from "@/lib/fish-catalog";
import { FISH_RARITIES, FISH_RARITY_LABELS } from "@/lib/fish-rarity";
import { FishFilter } from "./fish-filter";
import { FishRecordEditor } from "./fish-record-editor";

export function FishCatalog({
  fishes,
  canEdit = false,
}: {
  fishes: Fish[];
  canEdit?: boolean;
}) {
  const { gameLabel, t, formatNumber } = useI18n();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [qualities, setQualities] = useState<string[]>([]);
  const [selectedSpecialStats, setSelectedSpecialStats] = useState<string[]>(
    [],
  );
  const areas = [...new Set(fishes.map((fish) => fish.area).filter(Boolean))];
  const specialStats = [
    ...new Set(fishes.flatMap((fish) => fish.specialStats)),
  ].sort((a, b) => gameLabel("stat", a).localeCompare(gameLabel("stat", b)));
  const visible = fishes
    .filter((fish) =>
      matchesFishFilters(fish, {
        query,
        categories,
        areas: selectedAreas,
        qualities,
        specialStats: selectedSpecialStats,
      }),
    )
    .sort(
      (a, b) =>
        Number(b.specialStats.length > 0) - Number(a.specialStats.length > 0) ||
        a.name.localeCompare(b.name),
    );
  const filtered =
    query !== "" ||
    categories.length > 0 ||
    selectedAreas.length > 0 ||
    qualities.length > 0 ||
    selectedSpecialStats.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-4">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search fishes…")}
            aria-label={t("Search fishes")}
            className="h-11 pl-9"
          />
        </div>
        <FishFilter
          label={t("Category")}
          allLabel={t("All categories")}
          options={FISH_CATEGORIES.map((value) => ({ value, label: t(value) }))}
          selected={categories}
          onChange={setCategories}
        />
        <FishFilter
          label={t("Fishing area")}
          allLabel={t("All areas")}
          options={areas.map((value) => ({
            value,
            label: gameLabel("fishArea", value),
          }))}
          selected={selectedAreas}
          onChange={setSelectedAreas}
        />
        <FishFilter
          label={t("Quality")}
          allLabel={t("All qualities")}
          options={FISH_RARITIES.map((value) => ({
            value,
            label: t(FISH_RARITY_LABELS[value]),
          }))}
          selected={qualities}
          onChange={setQualities}
        />
        <FishFilter
          label={t("Special stats")}
          allLabel={t("All special stats")}
          options={[
            { value: "any", label: t("Has special stats") },
            { value: "none", label: t("No special stats") },
            ...specialStats.map((value) => ({
              value,
              label: gameLabel("stat", value),
            })),
          ]}
          selected={selectedSpecialStats}
          onChange={setSelectedSpecialStats}
        />
        {filtered && (
          <Button
            variant="ghost"
            className="min-h-11 justify-self-start"
            onClick={() => {
              setQuery("");
              setCategories([]);
              setSelectedAreas([]);
              setQualities([]);
              setSelectedSpecialStats([]);
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
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t(fish.fishType)}
                    </span>
                    <FishRarity rarity={fish.rarity} />
                  </div>
                </div>
              </div>
              <dl className="flex flex-1 flex-col gap-3 text-sm">
                {fish.bestSizeCm != null && (
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("Highest record")}
                    </dt>
                    <dd className="font-medium">
                      {formatNumber(fish.bestSizeCm)} cm
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground mb-1.5 text-xs">
                    {t("Base stats")}
                  </dt>
                  <dd>
                    <FishStats
                      stats={fish.baseStats}
                      bestSizeCm={fish.bestSizeCm}
                      sample={fish.statSample}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1.5 text-xs">
                    {t("Special stats")}
                  </dt>
                  <dd>
                    <FishStats
                      stats={fish.specialStats}
                      special
                      bestSizeCm={fish.bestSizeCm}
                      sample={fish.statSample}
                    />
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
              {canEdit && <FishRecordEditor fish={fish} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
