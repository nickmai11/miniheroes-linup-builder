// Client-safe types shared by the builds UI and the server helpers (no DB imports).
import type {
  HeroBuildRow,
  HeroCore,
  RuneAttribute,
  WeaponAttribute,
} from "@/db/schema";

export type HeroBuild = HeroBuildRow & {
  /** Chosen rune attributes in pick order (first = most important). */
  runes: RuneAttribute[];
  /** Chosen weapon attributes in pick order (first = most important). */
  weapons: WeaponAttribute[];
  /** Chosen hero cores in pick order (first = most important). */
  cores: HeroCore[];
};

/** A build on another hero, offered for copying into the current hero. */
export type ImportableBuild = {
  id: number;
  name: string;
  heroName: string;
  heroSlug: string;
};

export type ImportableBuildPage = {
  builds: ImportableBuild[];
  hasNextPage: boolean;
};
