import Image from "next/image";
import type { Divinity, Hero } from "@/db/schema";
import { versioned } from "@/lib/asset-version";
import { DivinityIcon } from "./divinity-icon";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** Square portrait tile: real image when available, initials placeholder otherwise. */
export function HeroPortrait({
  hero,
  divinities,
  divinitySize = 36,
  className = "",
  sizes = "96px",
  priority = false,
}: {
  hero: Pick<Hero, "name" | "imageUrl" | "role" | "rarity">;
  /** Mythic divinities in slot order; [0] overlays bottom-left, [1] bottom-right. */
  divinities?: Pick<Divinity, "name" | "iconUrl">[];
  divinitySize?: number;
  className?: string;
  sizes?: string;
  /** Eager-load above-the-fold portraits (first row of a grid). */
  priority?: boolean;
}) {
  return (
    <div
      className={`ring-border relative aspect-[81/100] w-full overflow-hidden rounded-md ring-1 ${className}`}
    >
      {hero.imageUrl ? (
        <Image
          src={versioned(hero.imageUrl)}
          alt={hero.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-lg font-semibold"
          aria-label={hero.name}
        >
          {initials(hero.name)}
        </div>
      )}
      {divinities && divinities.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-1.5">
          {divinities[0] ? (
            <DivinityIcon
              divinity={divinities[0]}
              size={divinitySize}
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
            />
          ) : (
            <span />
          )}
          {divinities[1] && (
            <DivinityIcon
              divinity={divinities[1]}
              size={divinitySize}
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
            />
          )}
        </div>
      )}
    </div>
  );
}

const BADGE_SRC: Record<Hero["role"], string> = {
  warrior: "/badges/warrior.png",
  marksman: "/badges/marksman.png",
  mage: "/badges/mage.png",
  support: "/badges/support.png",
};

/** In-game role badge, cut from the owner's screenshots. */
export function RoleBadge({
  role,
  size = 20,
  className = "",
}: {
  role: Hero["role"];
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={versioned(BADGE_SRC[role])}
      alt={role}
      title={role}
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

/** Hero name as used everywhere a hero is named. */
export function HeroName({
  hero,
  className = "",
}: {
  hero: Pick<Hero, "name">;
  className?: string;
}) {
  return (
    <span className={`min-w-0 leading-snug break-words ${className}`}>
      {hero.name}
    </span>
  );
}
