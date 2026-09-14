"use client";

import { useI18n } from "@/lib/i18n/client";
import Image from "next/image";
import type { Divinity } from "@/db/schema";
import { versioned } from "@/lib/asset-version";

/** The in-game divinity badge (orange frame, blue centre). */
export function DivinityIcon({
  divinity,
  size = 48,
  className = "",
}: {
  divinity: Pick<Divinity, "name" | "iconUrl">;
  size?: number;
  className?: string;
}) {
  const { gameLabel } = useI18n();

  return (
    <Image
      src={versioned(divinity.iconUrl)}
      alt={gameLabel("divinity", divinity)}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}
