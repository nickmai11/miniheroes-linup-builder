// Client-safe types shared by the builds UI and the server helpers (no DB imports).
import type {
  HeroBuildRow,
  HeroCore,
  HeroSkill,
  RuneAttribute,
  WeaponAttribute,
} from "@/db/schema";
import type { BuildPriority } from "@/lib/build-priorities";

export type Prioritized<T> = T & { priority: BuildPriority };
export type CoreWithSkill = HeroCore & { skill: HeroSkill | null };

export type HeroBuild = Omit<HeroBuildRow, "privateOwnerId"> & {
  isPrivate: boolean;
  /** Chosen attributes and cores in pick order, each with its saved tier. */
  runes: Prioritized<RuneAttribute>[];
  weapons: Prioritized<WeaponAttribute>[];
  cores: Prioritized<CoreWithSkill>[];
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
