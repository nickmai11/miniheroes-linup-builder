"use client";

import { useI18n } from "@/lib/i18n/client";
import { fishStatMaximum, type FishStatSample } from "@/lib/fish-measurements";

export function FishStats({
  stats,
  special = false,
  bestSizeCm,
  sample,
}: {
  stats: string[];
  special?: boolean;
  bestSizeCm?: number | null;
  sample?: FishStatSample | null;
}) {
  const { gameLabel, t, formatNumber } = useI18n();
  if (!stats.length)
    return (
      <span className="text-muted-foreground text-xs">
        {t("None recorded")}
      </span>
    );
  return (
    <ul className="flex flex-wrap gap-1.5">
      {stats.map((stat) => {
        const maximum = fishStatMaximum(stat, bestSizeCm, sample, special);
        return (
          <li
            key={stat}
            className={
              special
                ? "bg-primary/10 text-primary rounded-md px-2 py-1 text-xs"
                : "bg-muted rounded-md px-2 py-1 text-xs"
            }
          >
            {gameLabel("stat", stat)}
            {maximum !== null && (
              <span className="ml-1 font-semibold">
                ({formatNumber(maximum)}
                {special ? "%" : ""})
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
