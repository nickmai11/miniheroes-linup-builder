"use client";

import Image from "next/image";
import { baitSeeds } from "@/data/baits";
import { versioned } from "@/lib/asset-version";
import { useI18n } from "@/lib/i18n/client";

/** A fish's explicitly assigned bait; category preferences never imply a link. */
export function FishBait({ name }: { name: string | null }) {
  const { gameLabel, t } = useI18n();
  if (!name) return <span className="text-muted-foreground">{t("None")}</span>;
  const bait = baitSeeds.find((item) => item.name === name);
  return (
    <span className="inline-flex items-center gap-1.5">
      {bait && (
        <Image
          src={versioned(bait.iconUrl)}
          alt=""
          width={26}
          height={24}
          className="shrink-0 rounded"
        />
      )}
      <span>{gameLabel("bait", bait ?? name)}</span>
    </span>
  );
}
