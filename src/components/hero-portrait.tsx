import Image from "next/image";
import type { Hero } from "@/db/schema";
import { PORTRAIT_VERSION } from "@/lib/portrait-version";

function versioned(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${PORTRAIT_VERSION}`;
}

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
  className = "",
  sizes = "96px",
  priority = false,
}: {
  hero: Pick<Hero, "name" | "imageUrl" | "role" | "rarity">;
  className?: string;
  sizes?: string;
  /** Eager-load above-the-fold portraits (first row of a grid). */
  priority?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[81/100] w-full overflow-hidden rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 ${className}`}
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
          className="flex h-full w-full items-center justify-center bg-neutral-200 text-lg font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          aria-label={hero.name}
        >
          {initials(hero.name)}
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
}: {
  role: Hero["role"];
  size?: number;
}) {
  return (
    <Image
      src={BADGE_SRC[role]}
      alt={role}
      title={role}
      width={size}
      height={size}
      className="inline-block shrink-0"
    />
  );
}

/** "{badge} {name}" as used everywhere a hero is named. */
export function HeroName({
  hero,
  className = "",
  badgeSize = 18,
}: {
  hero: Pick<Hero, "name" | "role">;
  className?: string;
  badgeSize?: number;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
      <RoleBadge role={hero.role} size={badgeSize} />
      <span className="truncate">{hero.name}</span>
    </span>
  );
}
