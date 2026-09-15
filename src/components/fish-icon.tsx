"use client";

import Image from "next/image";
import { Fish as FishSymbol } from "lucide-react";
import type { Fish } from "@/db/schema";
import { versioned } from "@/lib/asset-version";

/** Decorative next to a fish's visible, translated name. */
export function FishIcon({
  fish,
  size = 28,
}: {
  fish: Pick<Fish, "iconUrl">;
  size?: number;
}) {
  if (!fish.iconUrl)
    return (
      <FishSymbol
        aria-hidden
        className="text-muted-foreground shrink-0"
        width={size}
        height={size}
      />
    );
  return (
    <Image
      src={versioned(fish.iconUrl)}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
    />
  );
}
