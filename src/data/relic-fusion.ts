/**
 * Relic fusion catalog, read from the Relic Archive and Fusion Archive on the
 * owner's account on 2026-11-06 (gameplay/relics/archive-2026-11-06-*.png and
 * fusion-archive-2026-11-06-*.png). Base relics have no recipe; Common, Rare and
 * Legend relics each have one; Mythic relics come out of the Mythic chest.
 */
export type Tier = "base" | "common" | "rare" | "legend" | "mythic" | "eternal";
export type Ingredient = { slug: string; count: number };
export type Relic = {
  slug: string;
  name: string;
  tier: Tier;
  recipe?: Ingredient[];
};

const r = (slug: string, count = 1): Ingredient => ({ slug, count });
const relic = (name: string, tier: Tier, recipe?: Ingredient[]): Relic => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  tier,
  recipe,
});

export const relics: Relic[] = [
  relic("Bronze Mirror", "base"),
  relic("Beast Bone", "base"),
  relic("Limestone", "base"),
  relic("Stone Hammer", "common", [r("bronze-mirror", 2), r("limestone", 4)]),
  relic("Bone Saw", "common", [r("beast-bone", 4), r("limestone", 2)]),
  relic("Bronze Dagger", "common", [r("bronze-mirror", 4), r("beast-bone", 2)]),
  relic("Mithril Axe", "rare", [r("bronze-dagger"), r("stone-hammer", 2)]),
  relic("Bone Scepter", "rare", [r("bronze-dagger", 2), r("stone-hammer")]),
  relic("Tribal Goblet", "rare", [r("bone-saw"), r("stone-hammer", 2)]),
  relic("Assembly Flag", "rare", [r("bone-saw", 2), r("stone-hammer")]),
  relic("Beast Totem", "rare", [r("bronze-dagger"), r("bone-saw", 2)]),
  relic("Puppet Doll", "rare", [r("bronze-dagger", 2), r("bone-saw")]),
  relic("Arcane Key", "legend", [
    r("puppet-doll"),
    r("beast-totem"),
    r("bone-scepter"),
  ]),
  relic("Tideblade", "legend", [
    r("assembly-flag"),
    r("bone-scepter"),
    r("mithril-axe"),
  ]),
  relic("Heart of Cleansing", "legend", [
    r("assembly-flag"),
    r("tribal-goblet"),
    r("bone-scepter"),
  ]),
  relic("Ruby Cup", "legend", [
    r("beast-totem"),
    r("bone-scepter"),
    r("mithril-axe"),
  ]),
  relic("Memorial Stele", "legend", [
    r("beast-totem"),
    r("assembly-flag"),
    r("tribal-goblet"),
  ]),
  relic("Dragon Seal", "legend", [
    r("puppet-doll"),
    r("tribal-goblet"),
    r("mithril-axe"),
  ]),
  relic("Buckler", "legend", [
    r("puppet-doll"),
    r("assembly-flag"),
    r("mithril-axe"),
  ]),
  relic("Broadsword", "legend", [
    r("puppet-doll"),
    r("beast-totem"),
    r("tribal-goblet"),
  ]),
  relic("Night Twinblades", "mythic"),
  relic("Charge Shield", "mythic"),
  relic("Spiked Armor", "mythic"),
  relic("Soulcalm Gem", "mythic"),
  relic("Boots of Haste", "mythic"),
  relic("Silverblade", "mythic"),
  relic("Pendant of Purity", "mythic"),
  relic("Arcane Cloak", "mythic"),
  relic("Heart of the Dragon", "eternal"),
  relic("Crystalline Aegis", "eternal"),
  relic("Eternal Armor", "eternal"),
  relic("Deathbringer Ballista", "eternal"),
  relic("Divine Radiance", "eternal"),
  relic("Staff of Annihilation", "eternal"),
  relic("Crystal Tower", "eternal"),
  relic("Hourglass of Chaos", "eternal"),
];

/**
 * Mythic relics come in two groups of four, each fused (via the Mythic chest)
 * from one group of four Legends. The archive shows one red chest for every
 * Mythic recipe, so which Legend group feeds which Mythic group is inferred from
 * the Eternal recipes, which pair the Mythics the same way (unverified).
 */
export const mythicGroups: { mythics: string[]; legends: string[] }[] = [
  {
    mythics: [
      "night-twinblades",
      "charge-shield",
      "spiked-armor",
      "soulcalm-gem",
    ],
    legends: ["broadsword", "buckler", "dragon-seal", "memorial-stele"],
  },
  {
    mythics: [
      "boots-of-haste",
      "silverblade",
      "pendant-of-purity",
      "arcane-cloak",
    ],
    legends: ["ruby-cup", "heart-of-cleansing", "tideblade", "arcane-key"],
  },
];

/** The Mythic chest's four formulas for a group: every triple of its Legends, in the Fusion Archive's order. */
export const chestRecipes = (legends: string[]): Ingredient[][] =>
  [1, 0, 2, 3].map((skip) =>
    legends.filter((_, i) => i !== skip).map((slug) => r(slug)),
  );

export const relicBySlug = new Map(relics.map((relic) => [relic.slug, relic]));

/** Rarities that make up the parts, tier by tier: [parts, their recipes merged, ...] down to base relics. */
export function expandToBase(parts: Ingredient[]): Ingredient[][] {
  const rows = [parts];
  while (rows.at(-1)!.some((part) => relicBySlug.get(part.slug)?.recipe)) {
    const merged = new Map<string, number>();
    for (const part of rows.at(-1)!)
      for (const sub of relicBySlug.get(part.slug)?.recipe ?? [part])
        merged.set(
          sub.slug,
          (merged.get(sub.slug) ?? 0) + sub.count * part.count,
        );
    rows.push(
      relics
        .filter((relic) => merged.has(relic.slug))
        .map((relic) => r(relic.slug, merged.get(relic.slug)!)),
    );
  }
  return rows;
}
