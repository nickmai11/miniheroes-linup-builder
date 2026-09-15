"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  FISH_RARITY_LABELS,
  FISH_RARITY_STYLES,
  type FishRarity as Rarity,
} from "@/lib/fish-rarity";

export function FishRarity({ rarity }: { rarity: Rarity | null }) {
  const { t } = useI18n();
  if (!rarity) return null;
  return (
    <span
      aria-label={t("Rarity: {rarity}", {
        rarity: t(FISH_RARITY_LABELS[rarity]),
      })}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap ${FISH_RARITY_STYLES[rarity]}`}
    >
      {t(FISH_RARITY_LABELS[rarity])}
    </span>
  );
}
