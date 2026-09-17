/** Owner-confirmed unreleased heroes, September 17, 2026. */
export const UNRELEASED_HERO_SLUGS = [
  "dreamstar-spirit",
  "nether-soul",
  "nightmare-source",
  "panda-warrior",
] as const;

export type HeroReleaseStatus = "released" | "unreleased";

const unreleased = new Set<string>(UNRELEASED_HERO_SLUGS);

export function getHeroReleaseStatus(slug: string): HeroReleaseStatus {
  return unreleased.has(slug) ? "unreleased" : "released";
}
