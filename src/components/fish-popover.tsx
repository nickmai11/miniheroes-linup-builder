"use client";

import { useI18n } from "@/lib/i18n/client";
import type { ReactElement } from "react";
import { InfoPopover } from "@/components/info-popover";
import type { Fish } from "@/db/schema";

export function FishPopover({
  fish,
  trigger,
}: {
  fish: Pick<Fish, "name" | "area" | "bait">;
  trigger?: ReactElement;
}) {
  const { gameLabel, t } = useI18n();

  return (
    <InfoPopover
      label={t("Where to get {name}", { name: gameLabel("fish", fish) })}
      popupClassName="w-64"
      trigger={
        trigger ?? (
          <button
            type="button"
            className="focus-visible:ring-ring/50 min-w-0 flex-1 rounded text-left underline decoration-dotted underline-offset-4 focus-visible:ring-3 focus-visible:outline-none"
          >
            {gameLabel("fish", fish)}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <h3 className="font-semibold">{gameLabel("fish", fish)}</h3>
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
        {fish.bait && (
          <div>
            <p className="text-muted-foreground text-xs">{t("Bait")}</p>
            <p>{gameLabel("bait", fish.bait)}</p>
          </div>
        )}
      </div>
    </InfoPopover>
  );
}
