"use client";

import { useI18n } from "@/lib/i18n/client";
import type { ReactElement } from "react";
import { InfoPopover } from "@/components/info-popover";
import type { Fish } from "@/db/schema";
import { FishBait } from "@/components/fish-bait";
import { FishIcon } from "@/components/fish-icon";
import { FishStats } from "@/components/fish-stats";

type FishPreview = Pick<
  Fish,
  | "slug"
  | "name"
  | "iconUrl"
  | "fishType"
  | "baseStats"
  | "specialStats"
  | "area"
  | "bait"
>;

export function FishPopover({
  fish,
  trigger,
}: {
  fish: FishPreview;
  trigger?: ReactElement;
}) {
  const { gameLabel, t } = useI18n();

  return (
    <InfoPopover
      label={t("{name} fish details", { name: gameLabel("fish", fish) })}
      popupClassName="w-80"
      trigger={
        trigger ?? (
          <button
            type="button"
            className="focus-visible:ring-ring/50 flex h-9 min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:ring-3 focus-visible:outline-none"
          >
            <FishIcon fish={fish} />
            <span className="min-w-0 flex-1 truncate underline decoration-dotted underline-offset-4">
              {gameLabel("fish", fish)}
            </span>
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-3">
          <FishIcon fish={fish} size={56} />
          <div className="min-w-0">
            <h3 className="font-semibold break-words">
              {gameLabel("fish", fish)}
            </h3>
            <p className="text-muted-foreground text-xs">{t(fish.fishType)}</p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs">
            {t("Base stats")}
          </p>
          <FishStats stats={fish.baseStats} />
        </div>
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs">
            {t("Special stats")}
          </p>
          <FishStats stats={fish.specialStats} special />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">
            {t("Where to get it")}
          </p>
          <p>
            {fish.area
              ? gameLabel("fishArea", fish.area)
              : t("Location not recorded yet.")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t("Bait")}</p>
          <FishBait name={fish.bait} />
        </div>
      </div>
    </InfoPopover>
  );
}

/** The same selected-fish chip in saved lineups and the builder. */
export function FishChip({
  fish,
  quantity,
}: {
  fish: FishPreview;
  quantity: number;
}) {
  const { gameLabel } = useI18n();
  return (
    <FishPopover
      fish={fish}
      trigger={
        <button
          type="button"
          className="bg-muted hover:bg-accent focus-visible:ring-ring/50 flex h-10 w-full min-w-0 items-center gap-2 rounded-md border px-2 py-1 text-left text-sm focus-visible:ring-3 focus-visible:outline-none"
        >
          <FishIcon fish={fish} />
          <span className="min-w-0 flex-1 truncate">
            {gameLabel("fish", fish)}
          </span>
          <span className="shrink-0 font-medium whitespace-nowrap">
            ×{quantity}
          </span>
        </button>
      }
    />
  );
}
