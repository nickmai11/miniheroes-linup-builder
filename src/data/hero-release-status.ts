/** Owner-confirmed unreleased heroes (Sep 17, 2026); Nightmare Source released Nov 6, Storm Sage Nov 11, 2026. */
export const UNRELEASED_HERO_SLUGS = [
  "dreamstar-spirit",
  "nether-soul",
  "panda-warrior",
] as const;

export type HeroReleaseStatus = "released" | "unreleased";

const unreleased = new Set<string>(UNRELEASED_HERO_SLUGS);

export function getHeroReleaseStatus(slug: string): HeroReleaseStatus {
  return unreleased.has(slug) ? "unreleased" : "released";
}
