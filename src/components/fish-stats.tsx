"use client";

import { useI18n } from "@/lib/i18n/client";

export function FishStats({
  stats,
  special = false,
}: {
  stats: string[];
  special?: boolean;
}) {
  const { gameLabel, t } = useI18n();
  if (!stats.length)
    return (
      <span className="text-muted-foreground text-xs">
        {t("None recorded")}
      </span>
    );
  return (
    <ul className="flex flex-wrap gap-1.5">
      {stats.map((stat) => (
        <li
          key={stat}
          className={
            special
              ? "bg-primary/10 text-primary rounded-md px-2 py-1 text-xs"
              : "bg-muted rounded-md px-2 py-1 text-xs"
          }
        >
          {gameLabel("stat", stat)}
        </li>
      ))}
    </ul>
  );
}
