"use client";

import { useI18n } from "@/lib/i18n/client";
import { FishChip } from "@/components/fish-popover";
import { FISH_CATEGORIES } from "@/lib/fish-selection";
import type { LineupFish } from "@/lib/lineups";

export function LineupFishes({ fishes }: { fishes: LineupFish[] }) {
  const { t } = useI18n();

  if (fishes.length === 0) return null;
  return (
    <div
      aria-label={t("Lineup fishes")}
      className="flex min-w-0 flex-col gap-2"
    >
      <p className="text-muted-foreground text-xs font-medium">{t("Fishes")}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FISH_CATEGORIES.map((category) => {
          const selected = fishes.filter((fish) => fish.fishType === category);
          if (selected.length === 0) return null;
          return (
            <div
              key={category}
              aria-label={t("{category} fishes", { category: t(category) })}
              className="flex min-w-0 flex-col gap-1.5"
            >
              <p className="text-muted-foreground text-xs">{t(category)}</p>
              <ul className="flex min-w-0 flex-col gap-1.5">
                {selected.map((fish) => (
                  <li key={fish.id} className="w-full min-w-0">
                    <FishChip fish={fish} quantity={fish.quantity} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
