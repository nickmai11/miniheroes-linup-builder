import type { ArtifactTier, SkillKind } from "@/db/schema";

/** Star unlock thresholds confirmed by the owner on 2026-09-13. */
export const HERO_AWAKENING_STAGES = [
  { stage: "I", unlockStars: 18 },
  { stage: "III", unlockStars: 22 },
] as const;

/** Hero-specific awakenings. Class-wide II/IV belong in shared class data. */
export type HeroAwakeningSkill = {
  stage: (typeof HERO_AWAKENING_STAGES)[number]["stage"];
  name: string;
  description: string;
  /** Owner screenshot filename under gameplay/talents/. */
  sourceScreenshot: string;
};

/**
 * Per-hero details transcribed from the owner's in-game screenshots
 * (gameplay/talents/, gameplay/divinities/). Talents, artifacts, cores and divinities
 * sync into the DB on view (syncHeroDetail in src/lib/heroes.ts); awakening skills
 * are read directly from this file. Icons come from scripts/slice-talent-icons.py.
 */
export type HeroDetailSeed = {
  /** The divine weapon from the Artifact tab. */
  artifact?: {
    name: string;
    iconUrl?: string;
    /**
     * One ability per quality tier in unlock order. Purple / gold / red name
     * the talent they modify (`skill`); rainbow is the artifact's own skill
     * and carries its `name` instead.
     */
    bonuses: {
      tier: ArtifactTier;
      skill?: string;
      name?: string;
      description: string;
    }[];
  };
  /**
   * Talents in unlock order: the ultimate (available from the start), then the
   * ring clockwise from the lower-left at 2★, 5★, 8★, 12★, 16★.
   */
  skills: {
    kind: SkillKind;
    name: string;
    description: string;
    unlockStars: number;
    /** Path under /public: /talents/<hero>/<skill-slug>.png. */
    iconUrl?: string;
  }[];
  /** `<Gear>·Core` bonuses; `skill` names the talent they modify. */
  cores: { name: string; skill: string; description: string }[];
  /** Mythic (red) divinity slugs: [bottom-left, bottom-right]. */
  divinities: string[];
  /** Read directly by the server; this fixed content needs no per-view DB sync. */
  awakeningSkills?: HeroAwakeningSkill[];
};

const talent = (hero: string, slug: string) => `/talents/${hero}/${slug}.png`;

export const heroDetailSeeds: Record<string, HeroDetailSeed> = {
  "sea-captain": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Commander",
        description:
          "At the start of battle, increases all allies' DEF by 15% (effect disappears upon own death).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.24\u202fAM.png",
      },
      {
        stage: "III",
        name: "Assault",
        description:
          "Reduces the cooldown time of Torrent and Ship Raid by 25%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.25\u202fAM.png",
      },
    ],
    artifact: {
      name: "Siren Blade",
      iconUrl: "/artifacts/sea-captain.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Water Blade",
          description:
            "When dealing damage, the farther the enemy from the caster, the higher the damage, capped at 4 times.",
        },
        {
          tier: "gold",
          skill: "Torrent",
          description:
            "On hit, reduces the enemy's DEF by 20% and MOV SPD by 25% for 5s.",
        },
        {
          tier: "red",
          skill: "Ghost Ship",
          description:
            "Converts 75% of the damage dealt to enemies into self HP.",
        },
        {
          tier: "rainbow",
          name: "Ship Raid",
          description:
            "Every 9s, summons a small fleet of ghost ships to ram into a random enemy, dealing 900% Physical DMG and knocking back the enemy significantly.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Ghost Ship",
        unlockStars: 0,
        iconUrl: talent("sea-captain", "ghost-ship"),
        description:
          "Summons a ghost ship to ram enemies, dealing 720% Physical DMG to enemies in a large area and stunning them for 2s.",
      },
      {
        kind: "battle",
        name: "Water Blade",
        unlockStars: 2,
        iconUrl: talent("sea-captain", "water-blade"),
        description:
          "Basic ATK has a 50% chance to deal damage to enemies within 300 yards in front.",
      },
      {
        kind: "enhance",
        name: "Rogue Waves",
        unlockStars: 5,
        iconUrl: talent("sea-captain", "rogue-waves"),
        description:
          "Ghost Ship: when the Ghost Ship is released, increases all allies' MOV SPD by 30% for 3s.",
      },
      {
        kind: "special",
        name: "Torrent",
        unlockStars: 8,
        iconUrl: talent("sea-captain", "torrent"),
        description:
          "Summons a water flow every 8s to stun an enemy for 2.5s and deal 450% Physical DMG.",
      },
      {
        kind: "passive",
        name: "Steadfast Body",
        unlockStars: 12,
        iconUrl: talent("sea-captain", "steadfast-body"),
        description: "HP increased by 15%, ATK increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Undying",
        unlockStars: 16,
        iconUrl: talent("sea-captain", "undying"),
        description:
          "Ghost Ship: when hitting enemies, it steals their souls, reducing their DMG Result by 15% and their HP Regen per second by 2% for 6s.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Ghost Ship",
        description: "Ghost Ship enhances Physical DMG by 360% of Attack.",
      },
      {
        name: "Brawler's Armor",
        skill: "Torrent",
        description:
          "Torrent additionally drains the target's Energy by 120 points.",
      },
      {
        name: "Cavalier Helm",
        skill: "Water Blade",
        description:
          "Water Blade additionally inflicts True DMG equal to 18% (54%) of Attack.",
      },
      {
        name: "Brawler's Boots",
        skill: "Undying",
        description:
          "Undying further reduces the enemy's final DMG dealt by 15%.",
      },
    ],
    divinities: ["warrior-atk", "atk"],
  },
  nezha: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Samadhi Flame",
        description:
          "Attacks deal bonus damage equal to 3% of the enemy's Max HP (capped at 150% of Nezha's Attack).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.32\u202fAM.png",
      },
      {
        stage: "III",
        name: "Lotus Ward",
        description:
          "For every 10% max HP lost, increases own energy recovery upon taking damage by 10%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.37\u202fAM.png",
      },
    ],
    artifact: {
      name: "Fire-Tipped Spear",
      iconUrl: "/artifacts/nezha.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Fire-Tipped Spear",
          description: '"Fire-Tipped Spear" trigger chance increased by 10%',
        },
        {
          tier: "gold",
          skill: "Armillary Sash",
          description:
            '"Armillary Sash" increases own defense by 15% for 4 s after each cast',
        },
        {
          tier: "red",
          skill: "Wind Fire Wheels",
          description: '"Wind Fire Wheels" releases 2 wheels per cast',
        },
        {
          tier: "rainbow",
          name: "Immortal Divine Body",
          description:
            "Upon taking fatal damage, instantly restore 55% of max HP and gain 30% DEF and 100% Energy Regen SPD per second for 8s. (Triggers once per battle)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Wind Fire Wheels",
        unlockStars: 0,
        iconUrl: talent("nezha", "wind-fire-wheels"),
        description:
          "Throw a Wind Fire Wheel towards the front of the battlefield, dealing 450% physical damage to all enemies in its path.",
      },
      {
        kind: "battle",
        name: "Fire-Tipped Spear",
        unlockStars: 2,
        iconUrl: talent("nezha", "fire-tipped-spear"),
        description:
          "30% chance to deal True DMG to enemies in front on Basic ATK.",
      },
      {
        kind: "enhance",
        name: "Windfire",
        unlockStars: 5,
        iconUrl: talent("nezha", "windfire"),
        description:
          "Wind Fire Wheels increases MOV SPD by 8% per cast, lasting until battle ends (max stacks: 3).",
      },
      {
        kind: "special",
        name: "Armillary Sash",
        unlockStars: 8,
        iconUrl: talent("nezha", "armillary-sash"),
        description:
          "When taking damage exceeding 10% of max HP in a single hit, releases Armillary Sash on the attacker, reducing their Energy Regen SPD by 40% per second and ATK by 25% for 5s (CD: 8 s).",
      },
      {
        kind: "passive",
        name: "Threefold Arms",
        unlockStars: 12,
        iconUrl: talent("nezha", "threefold-arms"),
        description: "Attack increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Scorching Ember",
        unlockStars: 16,
        iconUrl: talent("nezha", "scorching-ember"),
        description:
          "Wind Fire Wheels applies Scorching Ember to enemies hit, lasting 9 seconds. Enemies with Scorching Ember have their crit rate reduced by 12% and HP regeneration per second reduced by 1% (max stacks: 3).",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Wind Fire Wheels",
        description:
          "Wind Fire Wheels increases Physical DMG from attacks by 35%(105%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Windfire",
        description:
          "Windfire additionally boosts own Magic Resistance by 2.5%(7.5%) each time.",
      },
      {
        name: "Cavalier Helm",
        skill: "Fire-Tipped Spear",
        description:
          "Fire-Tipped Spear raises the chance to inflict True DMG by 6%(18%).",
      },
      {
        name: "Brawler's Boots",
        skill: "Armillary Sash",
        description:
          "Armillary Sash further slows Energy Regeneration speed by 10%(30%).",
      },
    ],
    divinities: ["atk", "melee-dmg-boost"],
  },
};
