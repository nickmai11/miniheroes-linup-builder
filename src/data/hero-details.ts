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
     * One ability per quality tier in unlock order. Talent bonuses name the
     * talent they modify (`skill`); standalone abilities carry their `name`.
     * Any quality may be standalone or linked; never infer attachment by tier.
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
  // Owner screenshots from 2026-09-14; Awakening I/III intentionally unrecorded.
  // Talent popups (0/2/5/8/12/16★): 7.53.30 AM.png, 7.53.22 AM.png, 7.53.24 AM.png, 7.53.25 AM.png, 7.53.27 AM.png, 7.53.28 AM.png.
  hela: {
    artifact: {
      name: "Spectral Crystal",
      iconUrl: "/artifacts/hela.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Dark Swarm",
          description:
            'The triggering probability of "Dark Swarm" increases by 5%',
        },
        {
          tier: "gold",
          skill: "Soul Shackles",
          description:
            '"Soul Shackles" can inflict a silence effect lasting 4s',
        },
        {
          tier: "red",
          skill: "Spectral Servant",
          description:
            '"Spectral Servant" Magic DMG dealt increases by 10%. Enemies hit by the specters have their DEF reduced by 10% and Energy Recovery SPD reduced by 10% for 6s (up to 3 stacks)',
        },
        {
          tier: "rainbow",
          name: "Aura of Dread",
          description:
            "Reduces DMG results inflicted by all enemy units by 10%. Every 8s, reduces the energy of the enemy with the highest Energy by 200 points",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Spectral Servant",
        unlockStars: 0,
        iconUrl: "/talents/hela/spectral-servant.png",
        description:
          "Release a multitude of specters swirling around. Every 0.4s, each specter will randomly attack a enemy target, dealing Magic DMG equal to 50% of ATK, lasting for 6s",
      },
      {
        kind: "battle",
        name: "Dark Swarm",
        unlockStars: 2,
        iconUrl: "/talents/hela/dark-swarm.png",
        description:
          "Basic ATK have a 20% chance to release a swarm forward, dealing Magic DMG equal to 180% of ATK to targets within range. Targets hit by this effect have their healing effect reduced by 50% for 5s",
      },
      {
        kind: "enhance",
        name: "Spectral Drain",
        unlockStars: 5,
        iconUrl: "/talents/hela/spectral-drain.png",
        description:
          "Spectral Servant Each time the Specter deals damage, 30% of the damage is converted into self HP",
      },
      {
        kind: "special",
        name: "Soul Shackles",
        unlockStars: 8,
        iconUrl: "/talents/hela/soul-shackles.png",
        description:
          "At regular intervals, deals Magic DMG equal to 120% of ATK to all targets who use magic attacks",
      },
      {
        kind: "attribute",
        name: "Undead Corpse",
        unlockStars: 12,
        iconUrl: "/talents/hela/undead-corpse.png",
        description: "ATK increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Spectres",
        unlockStars: 16,
        iconUrl: "/talents/hela/spectres.png",
        description:
          "Spectral Servant The ATK frequency changes to 0.3s. The Magic DMG inflicted by specters increases by 8%",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Spectral Servant",
        description:
          "「Spectral Servant」 inflicts additional Magic DMG equal to 15% of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Dark Swarm",
        description: "「Dark Swarm」 trigger chance raised by 18%",
      },
      {
        name: "Mage Robe",
        skill: "Spectral Drain",
        description:
          "「Spectral Drain」 additionally boosts life conversion ratio by 5%(15%)",
      },
      {
        name: "Spell Tome",
        skill: "Soul Shackles",
        description:
          "「Soul Shackles」 inflicts additional Magic DMG equal to 40%(120%) of ATK",
      },
    ],
    divinities: ["spd-reduction-res", "crit-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.54.16 AM.png, 7.54.03 AM 1.png, 7.54.05 AM.png, 7.54.07 AM.png, 7.54.09 AM.png, 7.54.11 AM.png.
  "shadow-master": {
    artifact: {
      name: "Grass Cutting Sword",
      iconUrl: "/artifacts/shadow-master.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Illusory Nightmare",
          description:
            '"Illusory Nightmare" Immediately releases upon entering the battlefield, then releases once per 15s.',
        },
        {
          tier: "gold",
          skill: "Flame Bullet",
          description:
            '"Flame Bullet" Now activates once every 10s, Fireball count +3',
        },
        {
          tier: "red",
          skill: "Phantom Slash",
          description:
            '"Phantom Slash" Increases the DMG range by 30%. Increases the stun duration of hit targets by 1.5s',
        },
        {
          tier: "rainbow",
          name: "Soulkeeping Technique",
          description:
            "Whenever an allied hero is defeated, increase ATK by 18% and CRIT Rate by 10% (stackable).",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Phantom Slash",
        unlockStars: 0,
        iconUrl: "/talents/shadow-master/phantom-slash.png",
        description:
          "Summoned spirits will activate spin-slash and deal 440% Physical DMG to enemies within range.",
      },
      {
        kind: "special",
        name: "Illusory Nightmare",
        unlockStars: 2,
        iconUrl: "/talents/shadow-master/illusory-nightmare.png",
        description:
          "Upon entering the Battlefield, causes one enemy target with the highest Physical ATK to enter Nightmare for 5s, and reduces its ATK by 20% for 5s after waking up (Enemies in nightmare cannot be awakened by Dispel-type skills)",
      },
      {
        kind: "enhance",
        name: "Enhance Slash",
        unlockStars: 5,
        iconUrl: "/talents/shadow-master/enhance-slash.png",
        description:
          '"Phantom Slash" Increases the Physical DMG dealt by 80%, with stun effects lasting for 1.5s',
      },
      {
        kind: "special",
        name: "Flame Bullet",
        unlockStars: 8,
        iconUrl: "/talents/shadow-master/flame-bullet.png",
        description:
          "Upon entering the battlefield, at the 10/20/40/60 second, shoot three fireballs at enemies. Each fireball will deal Physical DMG equal to 70% of ATK to single enemy targets and inflict Interruption effects. When the same target is hit by fireballs for 3 times, it will be stunned for 3s.",
      },
      {
        kind: "attribute",
        name: "Weakness Break",
        unlockStars: 12,
        iconUrl: "/talents/shadow-master/weakness-break.png",
        description: "ATK increased by 15%, CRIT Rate increased by 10%",
      },
      {
        kind: "enhance",
        name: "Blood Thirst",
        unlockStars: 16,
        iconUrl: "/talents/shadow-master/blood-thirst.png",
        description:
          "Phantom Slash cuts into the target's vitality, dealing bonus damage equal to 10% of their Max HP (capped at 300% of the Shadow Master's Attack).",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Phantom Slash",
        description:
          "「Phantom Slash」 inflicts additional Physical DMG equal to 50%(150%) of Attack",
      },
      {
        name: "Arrow Core",
        skill: "Illusory Nightmare",
        description:
          "「Illusory Nightmare」 further reduces the target's Attack by 5%(15%)",
      },
      {
        name: "Hunter's Cloak",
        skill: "Flame Bullet",
        description:
          "「Flame Bullet」 causes each fireball to deal additional Physical DMG equal to 20%(60%) of your Attack",
      },
      {
        name: "Crystal Pendant",
        skill: "Blood Thirst",
        description:
          "「Blood Thirst」 converts 6%(18%) of the DMG dealt by Phantom Slash into your own HP",
      },
    ],
    divinities: ["ranged-dmg-boost", "knockback-effect"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.54.48 AM.png, 7.54.40 AM.png, 7.54.41 AM.png, 7.54.42 AM.png, 7.54.45 AM.png, 7.54.46 AM.png.
  medusa: {
    artifact: {
      name: "Succubus Mask",
      iconUrl: "/artifacts/medusa.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Piercing Arrows",
          description:
            '"Piercing Arrow" Increases Physical DMGto the first target by 100%',
        },
        {
          tier: "gold",
          skill: "Energy Barrier",
          description:
            '"Energy Barrier" Increases DMG absorption ratio by 25%. During Energy Barrier activation, increases ATK SPD by 50%',
        },
        {
          tier: "red",
          skill: "Arcane Serpent",
          description:
            '"Arcane Serpent" Steals 35 energy points from the target each time it deals DMG Passive</c: When receiving single-instance DMG exceeding 10% of maximum HP, instantly release 1 single-target Arcane Serpents towards the attacker (Cooldown: 6s)',
        },
        {
          tier: "rainbow",
          skill: "Arcane Serpent",
          description:
            '"Arcane Serpent" Bounces +2, and inflicts a 2s stun effect',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Energy Barrier",
        unlockStars: 0,
        iconUrl: "/talents/medusa/energy-barrier.png",
        description:
          "Passive: When energy is higher than 50%, create an Energy Barrier to absorb 50% of DMG taken. Each point of energy can absorb DMG equal to 0.02% of HP. Energy Barrier automatically shuts down when energy falls below 10%",
      },
      {
        kind: "battle",
        name: "Piercing Arrows",
        unlockStars: 2,
        iconUrl: "/talents/medusa/piercing-arrows.png",
        description:
          "Basic ATK release Piercing Arrows to attack the first 3 enemy targets in front, dealing Physical DMG equal to 150% of ATK to the first target and 100% Physical DMG to other targets",
      },
      {
        kind: "enhance",
        name: "Ultimate Empower",
        unlockStars: 5,
        iconUrl: "/talents/medusa/ultimate-empower.png",
        description:
          "Energy Barrier Increases DMG absorption by 25% per point of energy",
      },
      {
        kind: "special",
        name: "Arcane Serpent",
        unlockStars: 8,
        iconUrl: "/talents/medusa/arcane-serpent.png",
        description:
          "In a set interval, release Arcane Serpents to bounce between enemy heroes 3 times, dealing Physical DMG equal to 120% of ATK in the first hit. Then Physical DMG of each following bounce increased by 60% (affects each enemy hero only once)",
      },
      {
        kind: "attribute",
        name: "Succubus Ancestry",
        unlockStars: 12,
        iconUrl: "/talents/medusa/succubus-ancestry.png",
        description: "ATK increased by 15%, Energy Regen SPD increased by 10%",
      },
      {
        kind: "enhance",
        name: "Sharp Arrowhead",
        unlockStars: 16,
        iconUrl: "/talents/medusa/sharp-arrowhead.png",
        description:
          "Piercing Arrow Targets +1, increases Physical DMG to other targets by 50%",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Piercing Arrows",
        description:
          "「Piercing Arrows」 each attack drains 2(6) point(s) of energy from the target.",
      },
      {
        name: "Arrow Core",
        skill: "Ultimate Empower",
        description:
          "「Ultimate Empower」 additionally boosts DMG Absorption by 2%(6%).",
      },
      {
        name: "Hunter's Cloak",
        skill: "Arcane Serpent",
        description:
          "「Arcane Serpent」 First attack deals bonus Physical DMG equal to 20%(60%) of ATK; each subsequent attack deals bonus Physical DMG equal to 10%(30%) of ATK.",
      },
      {
        name: "Crystal Pendant",
        skill: "Sharp Arrowhead",
        description:
          "「Sharp Arrowhead」 deals bonus Physical DMG to other targets equal to 10%(30%) of ATK.",
      },
    ],
    divinities: ["ranged-dmg-boost", "dmg-increase"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.06 AM.png, 7.54.59 AM.png, 7.55.01 AM.png, 7.55.02 AM.png, 7.55.04 AM.png, 7.55.05 AM.png.
  "two-headed-dragon": {
    artifact: {
      name: "Icy Heart",
      iconUrl: "/artifacts/two-headed-dragon.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Ice and Fire",
          description: '"Ice and Fire" Increases the trigger chance by 10%',
        },
        {
          tier: "gold",
          skill: "Icy Inferno",
          description:
            '"Icy Inferno" Damage radius increased by 30%, and the DMG dealt to enemies becomes True DMG.',
        },
        {
          tier: "red",
          skill: "Frost Domain",
          description:
            '"Frost Domain" Upon release, knocks back all enemies for a certain distance, and increases the Magic DMG dealt by the cold aura per second by 60%.',
        },
        {
          tier: "rainbow",
          skill: "Frost Domain",
          description:
            '"Frost Domain" Reduces the Energy needed for each release by 20%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Frost Domain",
        unlockStars: 0,
        iconUrl: "/talents/two-headed-dragon/frost-domain.png",
        description:
          "The Two-headed Dragon exhales a large amount of frost to the front, reducing the MOV SPD of enemies in range by 30% within 4, dealing Magic DMG equal to 40% of ATK every second. All enemies within the freezing range will be frozen for 2.5s after the cold aura is lifted.",
      },
      {
        kind: "battle",
        name: "Ice and Fire",
        unlockStars: 2,
        iconUrl: "/talents/two-headed-dragon/ice-and-fire.png",
        description:
          "Basic ATK have a 35% chance to release either Liquid Fire or Frost (Liquid Fire deals Magic ATK equal to 135% of ATK to targets in range and interrupts their casting, while Liquid Frost deals Magic ATK equal to 100% of ATK to enemies and freezes them for 2s)",
      },
      {
        kind: "enhance",
        name: "Enhance Chill",
        unlockStars: 5,
        iconUrl: "/talents/two-headed-dragon/enhance-chill.png",
        description:
          "Frost Domain Releases the cold aura to reduce enemies' MOV SPD by 10% and additionally reduce their ATK SPD by 10%",
      },
      {
        kind: "battle",
        name: "Icy Inferno",
        unlockStars: 8,
        iconUrl: "/talents/two-headed-dragon/icy-inferno.png",
        description:
          "At set interval, the Two-headed Dragon's two heads will exhale Ice and Fire forward, dealing Magic DMG equal to 50% of ATK to enemies in range for 2 time",
      },
      {
        kind: "attribute",
        name: "Dragon's Blood",
        unlockStars: 12,
        iconUrl: "/talents/two-headed-dragon/dragon-s-blood.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Extreme Cold",
        unlockStars: 16,
        iconUrl: "/talents/two-headed-dragon/extreme-cold.png",
        description:
          "Frost Domain Reduces the Energy used by 25% for the first release. Increases the freezing duration on enemies by 1.5s",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Frost Domain",
        description:
          "「Frost Domain」 inflicts Magic DMG equal to 10%(30%) of ATK per second",
      },
      {
        name: "Arcane Hat",
        skill: "Ice and Fire",
        description:
          "「Ice and Fire」 inflicts additional Magic DMG equal to 30%(90%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Enhance Chill",
        description:
          "「Enhance Chill」 additionally reduces ATK SPD by 12%(36%)",
      },
      {
        name: "Spell Tome",
        skill: "Icy Inferno",
        description:
          "「Icy Inferno」 each time inflicts Magic DMG equal to 10%(30%) of ATK",
      },
    ],
    divinities: ["hp", "heavy-injury"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.28 AM.png, 7.55.19 AM.png, 7.55.20 AM.png, 7.55.21 AM.png, 7.55.24 AM.png, 7.55.26 AM.png.
  "mermaid-princess": {
    artifact: {
      name: "Shallow Staff",
      iconUrl: "/artifacts/mermaid-princess.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Deep Sea Blessing",
          description: '"Deep Sea Blessing" Increases effect duration by 25s.',
        },
        {
          tier: "gold",
          skill: "Sanctus Waterball",
          description:
            '"Sanctus Waterball" Bounce count increased by 2 time(s), and the healing effect no longer diminishes over time.',
        },
        {
          tier: "red",
          skill: "Tide of Sighs",
          description:
            '"Tide of Sighs" Allied heroes within the water domain recover HP equal to 100% of the Mermaid Princess’s ATK per second.',
        },
        {
          tier: "rainbow",
          skill: "Deep Sea Blessing",
          description:
            '"Deep Sea Blessing" Additionally increases other allied heroes\' damage output by 15%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Tide of Sighs",
        unlockStars: 0,
        iconUrl: "/talents/mermaid-princess/tide-of-sighs.png",
        description:
          "Launches a waterball forward, dealing Magic DMG equal to 400% of ATK to a single target. Upon contact, the waterball creates a 350 water domain that lasts for 3s. Enemies entering this domain will have their MOV SPD reduced by 50%.",
      },
      {
        kind: "special",
        name: "Deep Sea Blessing",
        unlockStars: 2,
        iconUrl: "/talents/mermaid-princess/deep-sea-blessing.png",
        description:
          "Upon entering the battlefield, enhance the allied hero with the highest ATK, increasing their DMG Result by 25% for 15s.",
      },
      {
        kind: "enhance",
        name: "Tidal Phenomenon",
        unlockStars: 5,
        iconUrl: "/talents/mermaid-princess/tidal-phenomenon.png",
        description:
          "Tide of Sighs Increases the area of the created water domain by 30%.",
      },
      {
        kind: "special",
        name: "Sanctus Waterball",
        unlockStars: 8,
        iconUrl: "/talents/mermaid-princess/sanctus-waterball.png",
        description:
          "At set intervals, fires a healing waterball at the weakest allied hero, bouncing 3 times among allies, with each bounce restoring 150% of the Mermaid Princess’s ATK as HP (each Heal reduces the effect by 10%, and each ally can only be healed 1 times).",
      },
      {
        kind: "attribute",
        name: "Knockback",
        unlockStars: 12,
        iconUrl: "/talents/mermaid-princess/knockback.png",
        description: "Knockback effect increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Abyssal Waters",
        unlockStars: 16,
        iconUrl: "/talents/mermaid-princess/abyssal-waters.png",
        description:
          "Tide of Sighs Extends the duration of the created water domain by 1.5s, and enemies entering the water area will be unable to regen Energy.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Tide of Sighs",
        description:
          "「Tide of Sighs」 increases Magic DMG by 50% (150%) of Attack.",
      },
      {
        name: "Tome of Radiance",
        skill: "Deep Sea Blessing",
        description:
          "「Deep Sea Blessing」 additionally increases the DMG Result of the allied Hero with the highest Attack by 3% (9%).",
      },
      {
        name: "Luminous Visor",
        skill: "Sanctus Waterball",
        description:
          "「Sanctus Waterball」 additionally restores 30% (90%) of Attack as HP.",
      },
      {
        name: "Resonance Pendant",
        skill: "Abyssal Waters",
        description:
          "「Abyssal Waters」 additionally reduces the Melee DMG Reduct of enemies within its area by 10% (30%).",
      },
    ],
    divinities: ["hp", "anti-control-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.46 AM.png, 7.55.39 AM.png, 7.55.40 AM.png, 7.55.41 AM.png, 7.55.43 AM.png, 7.55.45 AM.png.
  "soul-doll": {
    artifact: {
      name: "Ghost Blade",
      iconUrl: "/artifacts/soul-doll.png",
      bonuses: [
        {
          tier: "purple",
          skill: "ATK Enhancement",
          description:
            '"ATK Enhancement" Increases the DMG Dealt by Basic ATK by 1.5% of Max HP.',
        },
        {
          tier: "gold",
          skill: "Thread Bind",
          description: '"Thread Bind" When in effect, increases ATK by 1%.',
        },
        {
          tier: "red",
          skill: "Soul Scissors",
          description:
            '"Soul Scissors" Within 5s of use, increases Knockback Resist by 35% and DMG Reduction by 20%.',
        },
        {
          tier: "rainbow",
          skill: "Soul Scissors",
          description:
            '"Soul Scissors" Upon defeating an enemy, immediately restores 25% Energy.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Soul Scissors",
        unlockStars: 0,
        iconUrl: "/talents/soul-doll/soul-scissors.png",
        description:
          "Summon a giant pair of scissors to snip the most vulnerable target in the enemy team 5 times, dealing Physical DMG equal to 260% of ATK with each snip.",
      },
      {
        kind: "battle",
        name: "ATK Enhancement",
        unlockStars: 2,
        iconUrl: "/talents/soul-doll/atk-enhancement.png",
        description:
          "Basic ATK deals DMG to the target equal to 2% of Max HP (cannot exceed 200% of Soul Doll’s ATK).",
      },
      {
        kind: "enhance",
        name: "Enhance Scissors",
        unlockStars: 5,
        iconUrl: "/talents/soul-doll/enhance-scissors.png",
        description: "Soul Scissors Increases Physical DMG dealt by 60%.",
      },
      {
        kind: "passive",
        name: "Thread Bind",
        unlockStars: 8,
        iconUrl: "/talents/soul-doll/thread-bind.png",
        description: "For every 3% of HP lost, gain 1% in DEF.",
      },
      {
        kind: "attribute",
        name: "Spiritual Cultivation",
        unlockStars: 12,
        iconUrl: "/talents/soul-doll/spiritual-cultivation.png",
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Heavy Blow",
        unlockStars: 16,
        iconUrl: "/talents/soul-doll/heavy-blow.png",
        description:
          "Soul Scissors Energy cost for each cast is reduced by 25%. And in 8s after getting hit, targets have their healing effect reduced by 35%.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Soul Scissors",
        description:
          "「Soul Scissors」 each cut increases Physical DMG by 20% (60%) of ATK.",
      },
      {
        name: "Cavalier Helm",
        skill: "ATK Enhancement",
        description:
          "「ATK Enhancement」 additionally reduces the target’s DEF by 10% (30%) for 4s.",
      },
      {
        name: "Brawler's Armor",
        skill: "Thread Bind",
        description: "「Thread Bind」 additionally gains 0.3% (1%) DEF.",
      },
      {
        name: "Brawler's Boots",
        skill: "Heavy Blow",
        description:
          "「Heavy Blow」 additionally reduces the target’s received healing by 10% (30%).",
      },
    ],
    divinities: ["receive-healing", "melee-dmg-boost"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.21 AM.png, 7.56.14 AM.png, 7.56.15 AM.png, 7.56.16 AM.png, 7.56.19 AM.png, 7.56.20 AM.png.
  baphomet: {
    artifact: {
      name: "Demonic Slash",
      iconUrl: "/artifacts/baphomet.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Devil's Entanglement",
          description:
            '"Devil\'s Entanglement" Changed to releasing once per 10s. Increases the Physical DMG dealt by each slash by 30%.',
        },
        {
          tier: "gold",
          skill: "Demonify",
          description:
            '"Demonify" Increases the effect duration by 2s. Targets hit have their healing effect reduced by 30%. Transformation would immediately knockback enemies in a small range.',
        },
        {
          tier: "red",
          skill: "Demonify",
          description:
            '"Demonify" Increases effect duration by 30%. ATK will now splatter, dealing Physical DMG equal to 50% of ATK to surrounding enemies in a small range.',
        },
        {
          tier: "rainbow",
          name: "Soul Absorption",
          description:
            "When the HP first falls below 35%, absorbs 30% of Max HP from the enemy with the highest HP (cannot exceed 1000% of the Baphomet’s ATK).",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Demonify",
        unlockStars: 0,
        iconUrl: "/talents/baphomet/demonify.png",
        description:
          "The Baphomet will transform into a powerful demon with Ranged ATK abilities with a range of 600%. ATK will be increased by 50%, lasting for 6s.",
      },
      {
        kind: "enhance",
        name: "Fanatic",
        unlockStars: 2,
        iconUrl: "/talents/baphomet/fanatic.png",
        description: "Demonify When in effect, increases ATK by 100%.",
      },
      {
        kind: "enhance",
        name: "Rebirth",
        unlockStars: 5,
        iconUrl: "/talents/baphomet/rebirth.png",
        description: "Demonify will immediately recover 10% of Max HP.",
      },
      {
        kind: "special",
        name: "Devil's Entanglement",
        unlockStars: 8,
        iconUrl: "/talents/baphomet/devil-s-entanglement.png",
        description:
          "Upon entering the battlefield, summons a small demon every 10s/25s/45s/70s. The demon inflicts 7 attacks against the enemy with the highest ATK, each dealing Physical DMG equal to 40% of ATK. The target’s ATK is reduced by 20%, and healing received is reduced by 50% for 6s.",
      },
      {
        kind: "attribute",
        name: "Devil's Wit",
        unlockStars: 12,
        iconUrl: "/talents/baphomet/devil-s-wit.png",
        description: "ATK increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "RES Skin",
        unlockStars: 16,
        iconUrl: "/talents/baphomet/res-skin.png",
        description:
          "Demonify When in effect, increases Ranged DMG Reduction by 20% and Knockback Resist by 80%. The effect will diminish over time.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Demonify",
        description: "「Demonify」 additionally increases ATK by 12% (36%).",
      },
      {
        name: "Cavalier Helm",
        skill: "Rebirth",
        description: "「Rebirth」 additionally restores 3% (10%) of Max HP.",
      },
      {
        name: "Brawler's Armor",
        skill: "Devil's Entanglement",
        description:
          "「Devil's Entanglement」 each slash increases Physical DMG by 20% (60%) of ATK.",
      },
      {
        name: "Brawler's Boots",
        skill: "RES Skin",
        description:
          "「RES Skin」 Additionally increases Ranged DMG Reduction by 5% (15%).",
      },
    ],
    divinities: ["heavy-injury", "atk-spd"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.40 AM.png, 7.56.33 AM.png, 7.56.35 AM.png, 7.56.36 AM.png, 7.56.37 AM.png, 7.56.39 AM.png.
  "masked-ninja": {
    artifact: {
      name: "Silverwolf Sword",
      iconUrl: "/artifacts/masked-ninja.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Silent Movement",
          description: '"Silent Movement" Extends effect duration by 10s.',
        },
        {
          tier: "gold",
          skill: "Power Regen",
          description:
            '"Power Regen" Increases DEF by 35% when triggered, lasting till the battle ends.',
        },
        {
          tier: "red",
          skill: "Barrier Shield",
          description:
            '"Barrier Shield" When in effect, continuously recovers 3.5% of Max HP per second.',
        },
        {
          tier: "rainbow",
          skill: "Silent Movement",
          description:
            '"Silent Movement" When in effect, continuously increases Knockback Resist by 60%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Barrier Shield",
        unlockStars: 0,
        iconUrl: "/talents/masked-ninja/barrier-shield.png",
        description:
          "Generate a barrier shield around yourself, increasing Magic DMG Reduction by 30%, lasting for 6s.",
      },
      {
        kind: "special",
        name: "Silent Movement",
        unlockStars: 2,
        iconUrl: "/talents/masked-ninja/silent-movement.png",
        description:
          "Upon entering the battlefield, increase MOV SPD by 35% and reduce DMG taken by 25%, lasting for 8s.",
      },
      {
        kind: "enhance",
        name: "Enhance Shield",
        unlockStars: 5,
        iconUrl: "/talents/masked-ninja/enhance-shield.png",
        description:
          "Barrier Shield Extends duration by 2s, increases Magic DMG Reduction by 5%.",
      },
      {
        kind: "passive",
        name: "Power Regen",
        unlockStars: 8,
        iconUrl: "/talents/masked-ninja/power-regen.png",
        description:
          "When receiving lethal damage, removes all debuffs and instantly restore 40% of Max HP (can only be triggered 1 time(s) per battle).",
      },
      {
        kind: "attribute",
        name: "Protect Charm",
        unlockStars: 12,
        iconUrl: "/talents/masked-ninja/protect-charm.png",
        description: "HP increased by 10%, Anti-CRIT Rate increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Super Barrier",
        unlockStars: 16,
        iconUrl: "/talents/masked-ninja/super-barrier.png",
        description:
          "Barrier Shield Additionally increases Anti-Control Rate by 50% and Knockback Resist by 30%.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Barrier Shield",
        description:
          "「Barrier Shield」 additionally increases Physical Resistance by 5% (15%).",
      },
      {
        name: "Cavalier Helm",
        skill: "Silent Movement",
        description:
          "「Silent Movement」 additionally reduces DMG taken by 3% (9%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Power Regen",
        description:
          "「Power Regen」 additionally restores 10% (30%) of own Max HP.",
      },
      {
        name: "Brawler's Boots",
        skill: "Super Barrier",
        description:
          "「Super Barrier」 additionally increases Control Resistance and Knockback Resistance by 5% (15%).",
      },
    ],
    divinities: ["hp", "magic-res"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.58 AM.png, 7.56.52 AM.png, 7.56.53 AM.png, 7.56.54 AM.png, 7.56.55 AM.png, 7.56.56 AM.png.
  "whaley-imp": {
    artifact: {
      name: "Trident",
      iconUrl: "/artifacts/whaley-imp.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Wave Slash",
          description:
            'When "Wave Slash" hits a target, further decreases DEF by 10% within 5s',
        },
        {
          tier: "gold",
          name: "Siren's Protection",
          description: "Cleanses the debuffs on self every 8s",
        },
        {
          tier: "red",
          skill: "Tsunami",
          description:
            '"Tsunami" Increases the DMG range by 30%, and temporarily immobilizes the target.',
        },
        {
          tier: "rainbow",
          name: "Siren's Shell",
          description:
            "Upon entering the battlefield, increases Block chance by 18%, lasting until the end of the battle",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Tsunami",
        unlockStars: 0,
        iconUrl: "/talents/whaley-imp/tsunami.png",
        description:
          "Summon a Tidal Wave to attack targets in front, dealing Physical DMG equal to 480% of ATK with Knockback effect",
      },
      {
        kind: "battle",
        name: "Wave Slash",
        unlockStars: 2,
        iconUrl: "/talents/whaley-imp/wave-slash.png",
        description:
          "Basic ATK has a 25% chance to swing the blade, dealing Physical DMG equal to 300% of ATK to enemies in range and reducing their DMG Result by 15% for 5s",
      },
      {
        kind: "enhance",
        name: "Enhance Tide",
        unlockStars: 5,
        iconUrl: "/talents/whaley-imp/enhance-tide.png",
        description:
          "Tsunami reduces the target's MOV SPD by 40%, lasting for 5s",
      },
      {
        kind: "passive",
        name: "Surge Guard",
        unlockStars: 8,
        iconUrl: "/talents/whaley-imp/surge-guard.png",
        description:
          "When a single DMG exceeds 10% of the Max HP, reduce the DMG by 35%",
      },
      {
        kind: "attribute",
        name: "Deep Sea Buildup",
        unlockStars: 12,
        iconUrl: "/talents/whaley-imp/deep-sea-buildup.png",
        description: "HP increased by 25%",
      },
      {
        kind: "enhance",
        name: "Sea God's Wrath",
        unlockStars: 16,
        iconUrl: "/talents/whaley-imp/sea-god-s-wrath.png",
        description:
          "Increases the Knockback Effect of Tsunami by 50%. Upon use, increases DEF by 30%, lasting for 5s",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Tsunami",
        description: "「Tsunami」 increases Physical DMG by 50% (150%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Wave Slash",
        description:
          "「Wave Slash」 additionally reduces enemy DMG dealt by 5% (15%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Surge Guard",
        description:
          "「Surge Guard」 additionally reduces DMG taken by 5% (15%) when triggered",
      },
      {
        name: "Brawler's Boots",
        skill: "Sea God's Wrath",
        description:
          "「Sea God's Wrath」 additionally increases own DEF by 10% (30%)",
      },
    ],
    divinities: ["hp", "anti-control-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.14 AM.png, 7.57.08 AM.png, 7.57.09 AM.png, 7.57.10 AM.png, 7.57.11 AM.png, 7.57.12 AM.png.
  "ironblade-mixed-race": {
    artifact: {
      name: "Ironwolf Blade",
      iconUrl: "/artifacts/ironblade-mixed-race.png",
      bonuses: [
        {
          tier: "purple",
          name: "Dragon Scale Protection",
          description: "Reduces Melee DMG taken by 20%",
        },
        {
          tier: "gold",
          skill: "Demonic Lineage",
          description:
            '"Demonic Lineage" For every 5% HP lost, increase HP Regen by 0.07%',
        },
        {
          tier: "red",
          skill: "Sky-Cutting Strike",
          description:
            '"Sky-Cutting Strike" Sword Aura has a 40% chance to deal the same DMG and effects to 3 enemy unit(s) in the front',
        },
        {
          tier: "rainbow",
          name: "Vampiric Powers",
          description:
            "Transforms into a demonic state when first receiving lethal damage, entering invincibility for 4s, MOV SPD increased by 20%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Sky-Cutting Strike",
        unlockStars: 0,
        iconUrl: "/talents/ironblade-mixed-race/sky-cutting-strike.png",
        description:
          "Release a sword aura, dealing Physical DMG equal to 850% of ATK to 2 enemy target(s) with Interrupt and knockback effects",
      },
      {
        kind: "battle",
        name: "Armor-Breaking Blow",
        unlockStars: 2,
        iconUrl: "/talents/ironblade-mixed-race/armor-breaking-blow.png",
        description:
          "Basic ATK deal an additional 35% final DMG to warrior-class enemies",
      },
      {
        kind: "enhance",
        name: "Enhance Aura",
        unlockStars: 5,
        iconUrl: "/talents/ironblade-mixed-race/enhance-aura.png",
        description: '"Sky-Cutting Strike" Knockback effect increased by 30%',
      },
      {
        kind: "passive",
        name: "Demonic Lineage",
        unlockStars: 8,
        iconUrl: "/talents/ironblade-mixed-race/demonic-lineage.png",
        description:
          "Gain 2% ATK and 1% DMG reduction effects for every 5% HP lost",
      },
      {
        kind: "attribute",
        name: "Demonic Boost",
        unlockStars: 12,
        iconUrl: "/talents/ironblade-mixed-race/demonic-boost.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Soul Hack",
        unlockStars: 16,
        iconUrl: "/talents/ironblade-mixed-race/soul-hack.png",
        description:
          "Sky-Cutting Strike deals bonus damage equal to 10% of the target's Max HP (capped at 500% of the Ironblade Mixed-Race's own Attack).",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Sky-Cutting Strike",
        description:
          "「Sky-Cutting Strike」 increases Physical DMG by 100% (300%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Armor-Breaking Blow",
        description:
          "「Armor-Breaking Blow」 deals an additional 5% (15%) DMG when attacking Warrior-class enemies",
      },
      {
        name: "Brawler's Armor",
        skill: "Enhance Aura",
        description:
          "「Enhance Aura」 additionally increases Knockback effect by 10% (30%)",
      },
      {
        name: "Brawler's Boots",
        skill: "Demonic Lineage",
        description:
          "「Demonic Lineage」 reduces the HP loss requirement by 0.5% (1.5%)",
      },
    ],
    divinities: ["hp", "control-res"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.29 AM.png, 7.57.23 AM.png, 7.57.25 AM.png, 7.57.26 AM.png, 7.57.27 AM.png, 7.57.28 AM.png.
  "roar-warrior": {
    artifact: {
      name: "Blazing Sun Axe",
      iconUrl: "/artifacts/roar-warrior.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Thirst",
          description:
            '"Thirst" Deals Physical DMG equal to 30% of ATK per second to targets inflicted with HP Drain',
        },
        {
          tier: "gold",
          skill: "Roar",
          description: '"Roar" Increases an extra 20% in Magic DMG Reduction',
        },
        {
          tier: "red",
          skill: "Elimination Axe",
          description:
            '"Elimination Axe" Immediately restore 22% of Max HP upon defeating an enemy, and increases MOV SPD by 20% and Knockback Resist by 20% for a set duration. Effect will decrease over time.',
        },
        {
          tier: "rainbow",
          name: "Blade Vine Armor",
          description:
            "Upon entering the battlefield, increase Reflect DMG by 20%. Reduces the attacker’s DEF by 12% within 5s of being attacked.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Elimination Axe",
        unlockStars: 0,
        iconUrl: "/talents/roar-warrior/elimination-axe.png",
        description:
          "Swings a giant axe to cleave a single enemy, dealing 400% of Attack as True Damage. If the target's HP falls below 30%, inflicts an additional 50% Damage.",
      },
      {
        kind: "battle",
        name: "Thirst",
        unlockStars: 2,
        iconUrl: "/talents/roar-warrior/thirst.png",
        description:
          "Basic ATK cause the target to enter HP Drain for 10s. Targets in HP Drain effect have their healing effect reduced by 35%",
      },
      {
        kind: "enhance",
        name: "Enhance Great Axe",
        unlockStars: 5,
        iconUrl: "/talents/roar-warrior/enhance-great-axe.png",
        description: "Increases the True DMG dealt by Elimination Axe by 100%",
      },
      {
        kind: "special",
        name: "Roar",
        unlockStars: 8,
        iconUrl: "/talents/roar-warrior/roar.png",
        description:
          "Upon entering the battlefield, increases Physical DMG Reduction by 20%, lasting until the battle ends",
      },
      {
        kind: "attribute",
        name: "Battle Soul",
        unlockStars: 12,
        iconUrl: "/talents/roar-warrior/battle-soul.png",
        description: "DEF increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Axe of Greatness",
        unlockStars: 16,
        iconUrl: "/talents/roar-warrior/axe-of-greatness.png",
        description:
          "Elimination Axe has a 100% chance to trigger additional damage. If the target is eliminated, restores Energy by an additional 40%",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Elimination Axe",
        description:
          "「Elimination Axe」 increases True DMG by 50% (150%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Thirst",
        description:
          "「Thirst」 additionally reduces the target’s Healing Received by 10% (30%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Roar",
        description:
          "「Roar」 additionally increases Physical DMG Reduction by 5% (15%)",
      },
      {
        name: "Brawler's Boots",
        skill: "Axe of Greatness",
        description:
          "「Axe of Greatness」 restores an additional 5% (15%) Energy upon killing an enemy",
      },
    ],
    divinities: ["atk", "heavy-injury"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.47 AM.png, 7.57.38 AM.png, 7.57.39 AM.png, 7.57.40 AM.png, 7.57.44 AM.png, 7.57.45 AM.png.
  "monkey-king": {
    artifact: {
      name: "Golden Cudgel",
      iconUrl: "/artifacts/monkey-king.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Stabilizing Cudgel",
          description:
            '"Sea Stabilizing Needle" Increases HP transform effects by 10%',
        },
        {
          tier: "gold",
          skill: "Monkey Clone",
          description:
            '"Monkey Clone" Increases the HP inherited by the clone by 35%',
        },
        {
          tier: "red",
          skill: "Golden Cudgel",
          description:
            '"Golden Cudgel" Increases DMG Range by 250%, used immediately while ignoring distance',
        },
        {
          tier: "rainbow",
          skill: "Monkey Clone",
          description:
            '"Monkey Clone" Summon 2 clone(s), and increases DMG Reduction by 25% within 8s of the summon.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Golden Cudgel",
        unlockStars: 0,
        iconUrl: "/talents/monkey-king/golden-cudgel.png",
        description:
          "Swing the Ruyi Golden Cudgel to slam the ground, dealing Physical DMG equal to 600% of ATK to targets in range, stunning them for 2.5s",
      },
      {
        kind: "battle",
        name: "Stabilizing Cudgel",
        unlockStars: 2,
        iconUrl: "/talents/monkey-king/stabilizing-cudgel.png",
        description:
          "Basic ATK deals Physical DMG equal to 150% of ATK to the target and converts 15% to own HP",
      },
      {
        kind: "enhance",
        name: "Enhanced Strike",
        unlockStars: 5,
        iconUrl: "/talents/monkey-king/enhanced-strike.png",
        description: "Golden Cudgel Increases Physical DMG dealt by 140%",
      },
      {
        kind: "special",
        name: "Monkey Clone",
        unlockStars: 8,
        iconUrl: "/talents/monkey-king/monkey-clone.png",
        description:
          "Upon entering the battlefield, summon a clone that possesses 50% of the host’s HP (can only be triggered 1 time(s) per battle)",
      },
      {
        kind: "attribute",
        name: "Forest Dance",
        unlockStars: 12,
        iconUrl: "/talents/monkey-king/forest-dance.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Ruyi Technique",
        unlockStars: 16,
        iconUrl: "/talents/monkey-king/ruyi-technique.png",
        description:
          "Golden Cudgel Increases the Physical DMG dealt by 140%, extends the Stun duration by 1s",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Golden Cudgel",
        description:
          "「Golden Cudgel」 deals additional DMG equal to 5% (15%) of the target’s lost HP (up to 180% (540%) of the Monkey King’s ATK)",
      },
      {
        name: "Cavalier Helm",
        skill: "Stabilizing Cudgel",
        description:
          "「Stabilizing Cudgel」 increases HP conversion ratio by 20% (60%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Monkey Clone",
        description:
          "「Monkey Clone」 clones inherit 25% (75%) of own Special Stats",
      },
      {
        name: "Brawler's Boots",
        skill: "Ruyi Technique",
        description:
          "「Ruyi Technique」 increases Physical DMG by 100% (300%) of ATK",
      },
    ],
    divinities: ["knockback-resist", "dmg-reduction"],
  },
  // Owner's 2026-09-13 12.47.59–12.48.15 PM gameplay captures.
  "radiant-envoy": {
    // Owner-approved MR-UK excerpt (2026-09-13): unique skills in I/III order.
    // Source is the supplied guide, not an in-game awakening capture.
    awakeningSkills: [
      {
        stage: "I",
        name: "Radiant Glow",
        description:
          "When [Final Spark], [Light Binding], or [Prismatic Barrier] deals damage to an enemy, it applies a mark for 4s. Marked targets take 11% increased damage from Radiant Envoy (cannot be dispelled).",
        sourceScreenshot: "image.png",
      },
      {
        stage: "III",
        name: "Holy Light Field",
        description:
          "3s after entering battle, dispels all negative status effects from the 1 ally with the lowest HP percentage and grants status immunity for 20s. This state can trigger again when self HP drops below 50%.",
        sourceScreenshot: "image.png",
      },
    ],
    artifact: {
      name: "Wand of Light",
      iconUrl: "/artifacts/radiant-envoy.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Light Binding",
          description:
            'Increases the binding duration of "Light Binding" by 1s.',
        },
        {
          tier: "gold",
          skill: "Prismatic Barrier",
          description:
            '"Prismatic Barrier" is first cast 5 s after entering battle. Subsequent skill cooldowns are reduced by 3s.',
        },
        {
          tier: "red",
          skill: "Final Spark",
          description:
            'The beam range of "Final Spark" becomes full-screen. The beam additionally deals True DMG equal to 55% of Attack.',
        },
        {
          tier: "rainbow",
          name: "Lucent Singularity",
          description:
            "8 s after entering battle, conjures a zone of light at the feet of the farthest enemy. Enemies within the zone have their ATK SPD reduced by 25%. If an enemy is a Support, they are Silenced. The zone detonates after 3 s, dealing Magic DMG equal to 300% of Attack to enemies inside. Cooldown: 15s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Final Spark",
        unlockStars: 0,
        iconUrl: talent("radiant-envoy", "final-spark"),
        description:
          "Unleashes a brilliant beam of light, dealing Magic DMG equal to 300% of Attack to enemies in a forward area and knocking them back.",
      },
      {
        kind: "battle",
        name: "Light Binding",
        unlockStars: 2,
        iconUrl: talent("radiant-envoy", "light-binding"),
        description:
          "Basic Attacks have a 35% chance to fire an orb of light, dealing Magic DMG equal to 200% of Attack to up to 2 forward enemies and binding them for 1 s.",
      },
      {
        kind: "enhance",
        name: "Enhanced Flash",
        unlockStars: 5,
        iconUrl: talent("radiant-envoy", "enhanced-flash"),
        description: "Increases Magic DMG dealt by Final Spark by 75%.",
      },
      {
        kind: "special",
        name: "Prismatic Barrier",
        unlockStars: 8,
        iconUrl: talent("radiant-envoy", "prismatic-barrier"),
        description:
          "Every 12s, hurls the wand forward. The wand grants allies in its path a Shield equal to 150% of Radiant Envoy's Attack for 6 s; and reduces Energy Regen speed of enemies in its path by 10% for 6 s. Repeatedly applied Bonuses or Bonus Reductions refresh their duration and do not stack.",
      },
      {
        kind: "passive",
        name: "Light Body",
        unlockStars: 12,
        iconUrl: talent("radiant-envoy", "light-body"),
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Beam Charge",
        unlockStars: 16,
        iconUrl: talent("radiant-envoy", "beam-charge"),
        description:
          "Energy cost to cast Final Spark is reduced by 15%. Enemies struck by the beam have their Damage dealt reduced by 15% for 6s.",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Final Spark",
        description:
          '"Final Spark" beam inflicts additional Magic DMG equal to 30% (90%) of Attack.',
      },
      {
        name: "Arcane Hat",
        skill: "Light Binding",
        description:
          '"Light Binding" light orb launch chance increases by 10% (30%).',
      },
      {
        name: "Mage Robe",
        skill: "Prismatic Barrier",
        // The 12.48.06 PM scroll completes the lower core panel.
        description:
          '"Prismatic Barrier" wand additionally reduces the Attack Speed of enemies in its path by 12% (36%) for 6s.',
      },
      {
        name: "Spell Tome",
        skill: "Beam Charge",
        // Preserve both the displayed 27% (80%) and "Melee DMG Reduction" wording.
        description:
          '"Beam Charge" enemies struck by the beam suffer an additional 27% (80%) reduction to their Melee DMG Reduction for 6s.',
      },
    ],
    divinities: ["dmg-increase", "magic-dmg-boost"],
  },
  "jungle-envoy": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Force of Nature",
        description:
          "Reduces all enemies’ Attack by 15% for 12s after entering the battlefield; the effect then gradually decreases over the next 18s, disappearing after 30s of battle",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.24\u202fAM.png",
      },
      {
        stage: "III",
        name: "Tranquil Redemption",
        description:
          "Each time Lightning Storm or Demonic Edict is cast, heals the ally with the lowest HP for 130% of own ATK.",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.25\u202fAM.png",
      },
    ],
    artifact: {
      name: "Verdant Staff",
      iconUrl: "/artifacts/jungle-envoy.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Lightning Storm",
          description: "Lightning additionally strikes 1 other enemies.",
        },
        {
          tier: "gold",
          skill: "Demonic Edict",
          description:
            "First cast time is reduced to 5s after the battle starts. The closer the enemy is, the higher the DMG they take—up to 1x true DMG.",
        },
        {
          tier: "red",
          skill: "Pulse Nova",
          description:
            "Duration increases by 3s, reduces target's injured Energy Regen by 80%, and Pulse deals 2x damage to Warrior-class heroes",
        },
        {
          tier: "rainbow",
          name: "Agonizing Rend",
          description:
            "When taking a single hit that exceeds 9% of max HP, rips the ground beneath the attacker, stunning them for 3s as a counter. While stunned, the target cannot recover energy. CD: 7s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Pulse Nova",
        unlockStars: 0,
        iconUrl: talent("jungle-envoy", "pulse-nova"),
        description:
          "Summons Pulse Nova, dealing 38% of ATK as magic DMG per second to all enemies for 7s (cannot be dispelled, ends upon death, reactivating refreshes duration).",
      },
      {
        kind: "battle",
        name: "Lightning Storm",
        unlockStars: 2,
        iconUrl: talent("jungle-envoy", "lightning-storm"),
        description:
          "Every 7s, summons a lightning storm above the 2 frontmost enemies, dealing magic DMG equal to 160% of own ATK and knocking them back.",
      },
      {
        kind: "enhance",
        name: "Enhanced Pulse",
        unlockStars: 5,
        iconUrl: talent("jungle-envoy", "enhanced-pulse"),
        description: "Pulse Nova: Increases magic DMG dealt by pulses by 10%",
      },
      {
        kind: "special",
        name: "Demonic Edict",
        unlockStars: 8,
        iconUrl: talent("jungle-envoy", "demonic-edict"),
        description:
          "9s after the battle begins, triggers a 4s magic explosion that deals true DMG equal to 55% of own ATK per second to a random enemy. Cooldown: 11s.",
      },
      {
        kind: "passive",
        name: "Jungle Warden",
        unlockStars: 12,
        iconUrl: talent("jungle-envoy", "jungle-warden"),
        description: "HP increased by 25%",
      },
      {
        kind: "enhance",
        name: "Power Surge",
        unlockStars: 16,
        iconUrl: talent("jungle-envoy", "power-surge"),
        description:
          "Lightning Storm: Immediately casts a Lightning Storm upon entering battle. The intense current numbs the target, reducing target's knockback effect by 30% for 3s",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Pulse Nova",
        description: "Pulse Nova: Pulses inflict a 30% Heavy Injury Effect",
      },
      {
        name: "Arcane Hat",
        skill: "Lightning Storm",
        description: "Lightning Storm: ATK's Magic DMG increased by 30%(90%)",
      },
      {
        name: "Mage Robe",
        skill: "Enhanced Pulse",
        description:
          "Enhanced Pulse: pulses deal additional Magic DMG equal to 12% of ATK",
      },
      {
        name: "Spell Tome",
        skill: "Demonic Edict",
        // This core description uses a different name for Demonic Edict.
        description: "Demon's Decree reduces subsequent cooldown by 3 s",
      },
    ],
    divinities: ["magic-dmg-boost", "knockback-effect"],
  },
  "radiant-paladin": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Sacred Body",
        description:
          "For every loss of 10% max HP, increases self Physical RES by 3% and Injured Energy Regen effect by 3.5%",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.58\u202fAM.png",
      },
      {
        stage: "III",
        name: "Wings of Purity",
        description:
          "Upon HP first dropping below 40%, immune to Physical DMG for 4s and restores 5% max HP per second",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.00\u202fAM.png",
      },
    ],
    artifact: {
      name: "Sacred Book",
      iconUrl: "/artifacts/radiant-paladin.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Sanctity Hammer",
          description: "Converts 70% of DMG dealt to enemies into self-healing",
        },
        {
          tier: "gold",
          skill: "Purifying Light",
          description: "Reduces the intervals of release by 25%",
        },
        {
          tier: "red",
          skill: "Guardian of Light",
          description:
            "Duration increased by 3s, clearing all debuffs upon activation",
        },
        {
          tier: "rainbow",
          name: "Sanctuary Guardian",
          description:
            "Upon entering the battlefield, reduce all enemies' ATK SPD by 20% and MOV SPD by 10%. Applies 1 Guardian of Light to the weakest allied hero every 10s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Guardian of Light",
        unlockStars: 0,
        iconUrl: talent("radiant-paladin", "guardian-of-light"),
        description:
          "Summon the power of light to protect all friendly units, increasing DEF by 30% for 4 s",
      },
      {
        kind: "battle",
        name: "Sanctity Hammer",
        unlockStars: 2,
        iconUrl: talent("radiant-paladin", "sanctity-hammer"),
        description:
          "Basic ATK have a 50% chance to deal 120% True DMG to the target with a knockback effect",
      },
      {
        kind: "enhance",
        name: "Illumination",
        unlockStars: 5,
        iconUrl: talent("radiant-paladin", "illumination"),
        description:
          "During Guardian of Light, Energy Regen SPD increases by 10%",
      },
      {
        kind: "passive",
        name: "Purifying Light",
        unlockStars: 8,
        iconUrl: talent("radiant-paladin", "purifying-light"),
        description: "Every 8s, remove debuffs from 2 allied heroes",
      },
      {
        kind: "attribute",
        name: "Sacred Incarnate",
        unlockStars: 12,
        iconUrl: talent("radiant-paladin", "sacred-incarnate"),
        description: "Magic RES increased by 10%, and HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Divine Guardian",
        unlockStars: 16,
        iconUrl: talent("radiant-paladin", "divine-guardian"),
        description:
          "During Guardian of Light, restore Radiant Paladin's HP equal to 35% of its ATK per second",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Sanctity Hammer",
        description: "Sanctity Hammer trigger chance increased by 10%(30%)",
      },
      {
        name: "Tome of Radiance",
        skill: "Illumination",
        description:
          "Illumination additionally increases Energy Regen speed by 2%(6%)",
      },
      {
        name: "Luminous Visor",
        skill: "Purifying Light",
        description:
          "Purifying Light additionally heals allies for 30%(100%) of Attack as HP",
      },
      {
        name: "Resonance Pendant",
        skill: "Divine Guardian",
        description:
          "Divine Guardian additionally heals the Radiant Paladin for 15%(45%) of Attack as HP per second",
      },
    ],
    divinities: ["physical-res", "anti-control-rate"],
  },
  "holy-healer": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Eudaemon Blessing",
        description:
          "When enemies cast energy skills, applies a shield equal to Holy Healer's 200% ATK to the weakest ally (Cooldown: 12s)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.37.31\u202fAM.png",
      },
      {
        stage: "III",
        name: "Conviction",
        description:
          "Every 8s during battle, reduces the Energy Regen SPD of the enemy with the highest accumulated damage by 55% for 5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.37.33\u202fAM.png",
      },
    ],
    artifact: {
      name: "Recover Staff",
      iconUrl: "/artifacts/holy-healer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Darkness Land",
          // The artifact calls this talent Darkness Forbidden Land.
          description:
            "Darkness Forbidden Land: Reduces the MOV SPD of enemies within range by 50%",
        },
        {
          tier: "gold",
          skill: "Meteor Falls",
          description: "Increases DMG range by 30%, meteor count +2",
        },
        {
          tier: "red",
          skill: "Meteor Falls",
          description:
            "Increases DEF of allied heroes hit by the meteor by 20%. Decreases the ATK of enemies hit by the meteor by 15%, lasting for 6s.",
        },
        {
          tier: "rainbow",
          name: "Starry Salvation",
          description:
            "Heals the weakest allied hero periodically with HP equal to 320% of Holy Healer’s ATK, and increase DMG Reduction by 20% within 8s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Darkness Land",
        unlockStars: 0,
        iconUrl: talent("holy-healer", "darkness-land"),
        description:
          'Place a Forbidden Land in the front, lasting for 3s. Enemies entering the Forbidden Land will be silenced and lose 50 Energy per second. When the "Forbidden Land" disappears, enemies within range will be stunned for 2.5s.',
      },
      {
        kind: "enhance",
        name: "Darkness Strike",
        unlockStars: 2,
        iconUrl: talent("holy-healer", "darkness-strike"),
        description:
          "Darkness Forbidden Land: Enemies within range will receive Magic DMG equal to 70% of ATK per second from the Holy Healer",
      },
      {
        kind: "enhance",
        name: "Darkness Befalls",
        unlockStars: 5,
        iconUrl: talent("holy-healer", "darkness-befalls"),
        description: "Darkness Forbidden Land: Extends the duration by 2s",
      },
      {
        kind: "special",
        name: "Meteor Falls",
        unlockStars: 8,
        iconUrl: talent("holy-healer", "meteor-falls"),
        description:
          "At set intervals, 3 meteor(s) will be summoned, dealing Magic DMG equal to 50% of ATK to enemies while restoring HP to allied heroes within range equal to 80% of Holy Healer's ATK",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("holy-healer", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Darkest Hour",
        unlockStars: 16,
        iconUrl: talent("holy-healer", "darkest-hour"),
        description:
          "Darkness Forbidden Land: Increases the DMG range by 30% and extends the stun effect by 1.5s",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Darkness Land",
        description:
          "Darkness Land additionally drains 2%(6%) of Current HP per second (up to a maximum of 30%(90%) of the Holy Healer's Attack)",
      },
      {
        name: "Tome of Radiance",
        skill: "Darkness Strike",
        description:
          "Darkness Strike additionally inflicts Magic DMG equal to 15%(45%) of Attack per second",
      },
      {
        name: "Luminous Visor",
        skill: "Meteor Falls",
        description:
          "Meteor Falls additionally restores 20%(60%) of Attack as HP",
      },
      {
        name: "Resonance Pendant",
        skill: "Darkest Hour",
        description:
          "Darkest Hour reduces the Magic RES of enemies within the Darkness Land by 10%(30%)",
      },
    ],
    divinities: ["support-atk", "melee-dmg-boost"],
  },
  silence: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Blade Break",
        description:
          "Wisdom Blade has a 40% chance to damage 2 enemies in front. The same target attacked 4 times will reduce their DEF by 10% for 5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.28\u202fAM.png",
      },
      {
        stage: "III",
        name: "Soul Sustenance",
        description:
          "For each fallen 1 allies on the battlefield, increases self ATK by 4.5% and DEF by 4.5%, effects last until the end of battle",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.29\u202fAM.png",
      },
    ],
    artifact: {
      name: "Blood Knight",
      iconUrl: "/artifacts/silence.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Wisdom Blade",
          description: "Reduces 60 Energy from targets hit.",
        },
        {
          tier: "gold",
          skill: "Magic Curse",
          description: "Increases the Magic ATK DMG dealt by 120%",
        },
        {
          tier: "red",
          skill: "Silence Domain",
          description:
            "Silences a target and deals Magic DMG equal to 70% of ATK per second, decreasing MOV SPD by 30% during this period",
        },
        {
          tier: "rainbow",
          name: "Silent Sensing",
          // The scrolled 11.34.46 capture completes the ability description.
          description:
            "Periodically targets an enemy with the highest Energy in range and releases a small-scaled mysterious curse. Deals Magic DMG equal to 100% of ATK and deducts 30 energy per second, lasting for 5s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Silence Domain",
        unlockStars: 0,
        iconUrl: talent("silence", "silence-domain"),
        // The complete 11.34.40 text supplies no duration unit after "4".
        description:
          "Silences all enemy heroes for 4 and only allows Basic ATK.",
      },
      {
        kind: "special",
        name: "Wisdom Blade",
        unlockStars: 2,
        iconUrl: talent("silence", "wisdom-blade"),
        description:
          "Normal attacks burn with extra potency, dealing an additional 35% of Attack as True Damage.",
      },
      {
        kind: "enhance",
        name: "ATK Reduction",
        unlockStars: 5,
        iconUrl: talent("silence", "atk-reduction"),
        description:
          "Silence Domain Decreases the ATK of affected enemies by 12% within 6s",
      },
      {
        kind: "battle",
        name: "Magic Curse",
        unlockStars: 8,
        iconUrl: talent("silence", "magic-curse"),
        description:
          "When an enemy releases an Energy skill, it will deal a Magic DMG equal to 150% of ATK to the caster and prevent the caster from recovering Energy for 2s",
      },
      {
        kind: "attribute",
        name: "Arcane Enhanced",
        unlockStars: 12,
        iconUrl: talent("silence", "arcane-enhanced"),
        description: "Energy Regen SPD increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Energy Drain",
        unlockStars: 16,
        iconUrl: talent("silence", "energy-drain"),
        description:
          "Silence Domain: When released, immediately deduct 100 Energy points from all affected enemies",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Wisdom Blade",
        description: "Wisdom Blade increases True DMG by 15%(45%) of Attack",
      },
      {
        name: "Tome of Radiance",
        skill: "ATK Reduction",
        description: "ATK Reduction extends the duration by 0.5(1.5) s",
      },
      {
        name: "Luminous Visor",
        skill: "Magic Curse",
        description:
          "Magic Curse inflicts additional Magic DMG equal to 40%(120%) of Attack",
      },
      {
        name: "Resonance Pendant",
        skill: "Energy Drain",
        description:
          "Energy Drain drains an additional 15(45) points of energy",
      },
    ],
    divinities: ["support-atk", "magic-dmg-boost"],
  },
  gunslinger: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Swift Victory",
        description:
          "Upon entering battle, increases self Energy Recovery SPD by 40% for 25s, gradually diminishing over time",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.51\u202fAM.png",
      },
      {
        stage: "III",
        name: "Frenzy",
        description:
          "Each time Snipe is cast, increases self ATK by 10% and ATK SPD by 10%. This effect lasts until the end of the battle (up to 2 stacks)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.53\u202fAM.png",
      },
    ],
    artifact: {
      name: "Flame-red Robe",
      iconUrl: "/artifacts/gunslinger.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Shotgun",
          description:
            "Increases the DMG range by 50%, increasing the Physical DMG dealt by 100%.",
        },
        {
          tier: "gold",
          // This gold-tier ability is standalone in the 11.35.15 popup.
          name: "Full-out Shooting",
          description:
            "Upon entering the battlefield, increases CRIT Rate by 20% and Knockback Effect by 50% within 12s.",
        },
        {
          tier: "red",
          skill: "Snipe",
          description: "Deals 1.1~1.4 times DMG randomly to the target",
        },
        {
          tier: "rainbow",
          skill: "Snipe",
          description:
            "Upon defeating the target, gains an additional 300 points of Energy.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Snipe",
        unlockStars: 0,
        iconUrl: talent("gunslinger", "snipe"),
        description:
          "Snipe the furthest enemy, dealing Physical DMG equal to 820% of ATK, with a stun effect lasting for 1.5s. The DMG dealt by Snipe will not replenish Energy for the enemy",
      },
      {
        kind: "special",
        name: "Shotgun",
        unlockStars: 2,
        iconUrl: talent("gunslinger", "shotgun"),
        description:
          "Fires the Shotgun once in a set interval, dealing 100% Physical DMG to enemies in range. Decreases the MOV SPD of enemies hit by the Shotgun by 80%. The speed reduction effect will diminish over time",
      },
      {
        kind: "enhance",
        name: "Quick Snipe",
        unlockStars: 5,
        iconUrl: talent("gunslinger", "quick-snipe"),
        description: "Snipe Reduces the Energy needed for each shot by 25%",
      },
      {
        kind: "battle",
        name: "Headshot",
        unlockStars: 8,
        iconUrl: talent("gunslinger", "headshot"),
        description:
          "Normal attacks have a 70% chance to land a crushing blow, dealing an extra 50% of Attack as Physical DMG, briefly stunning the target, and increasing the Knockback Effect by 40%.",
      },
      {
        kind: "attribute",
        name: "Aim",
        unlockStars: 12,
        iconUrl: talent("gunslinger", "aim"),
        description: "Increase ATK SPD by 15%, and CRIT Rate by 10%",
      },
      {
        kind: "enhance",
        name: "Enhance Snipe",
        unlockStars: 16,
        iconUrl: talent("gunslinger", "enhance-snipe"),
        description:
          "Snipe extends its stun duration by 1.5 seconds. If the target's HP is above 60%, it deals an additional 25% Damage.",
      },
    ],
    cores: [
      {
        name: "Arrow Core",
        skill: "Shotgun",
        // The scrolled 11.35.00 capture completes the Arrow Core panel.
        description:
          "Shotgun increases the Physical DMG of your Attack by 150%(450%)",
      },
      {
        name: "Hunter's Cloak",
        skill: "Headshot",
        description: "Headshot increases Stun Time by 0.3(1) s",
      },
      {
        name: "Crystal Pendant",
        skill: "Enhance Snipe",
        description:
          "Enhance Snipe lowers the HP threshold required to deal extra DMG by 20%(60%)",
      },
      {
        name: "Swift Longbow",
        skill: "Snipe",
        // This fourth panel is visible in the scrolled 11.35.10 capture.
        description:
          "Snipe reduces the Attack of the Snipe Target by 10%(30%) for 8 s",
      },
    ],
    divinities: ["ranged-dmg-reduction", "crit-damage"],
  },
  "silver-warrior": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Lone And Brave",
        description:
          "When HP first drops below 50%, gain immunity to certain control and slow effects for 7.5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.52\u202fAM.png",
      },
      {
        stage: "III",
        name: "Killing Intent",
        description:
          "The final strike of Godslayer Strike stuns the enemy for 4s and reduces the cooldown of Dawn Slash by 1.5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.54\u202fAM.png",
      },
    ],
    artifact: {
      name: "Gunblade",
      iconUrl: "/artifacts/silver-warrior.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Dawn Slash",
          description:
            "The sword slash has a 35% chance to deal True DMG to the enemy",
        },
        {
          tier: "gold",
          skill: "Adrenaline",
          description:
            "Duration increased by 1s. Stuns all enemies for 1s when skill activated",
        },
        {
          tier: "red",
          skill: "Godslayer Strike",
          description:
            "Each time this skill is cast, instantly restores 30% of lost HP and reduce damage taken by 18% for the next 6s",
        },
        {
          tier: "rainbow",
          name: "Potential Unleashed",
          description:
            "For every 6% of maximum HP lost, permanently increase self DEF by 2.5% and Armor PEN by 2.5% (up to 15 stacks)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Godslayer Strike",
        unlockStars: 0,
        iconUrl: talent("silver-warrior", "godslayer-strike"),
        description:
          "Splits the weapon into 5 secondary blades of different forms. All secondary blades will lock onto and attack the foremost one enemy, dealing Physical DMG equal to 300% of ATK per blade",
      },
      {
        kind: "battle",
        name: "Dawn Slash",
        unlockStars: 2,
        iconUrl: talent("silver-warrior", "dawn-slash"),
        description:
          "Every 8s, unleash a sword slash forward, dealing Physical DMG equal to 280% of ATK to up to 3 enemies in front. With each enemy hit, both the damage and knockback effects of the sword slash increase by 20%",
      },
      {
        kind: "enhance",
        name: "Mad Blade",
        unlockStars: 5,
        iconUrl: talent("silver-warrior", "mad-blade"),
        description:
          "Godslayer Strike Physical DMG dealt by each secondary blade increases by 80%",
      },
      {
        kind: "special",
        name: "Adrenaline",
        unlockStars: 8,
        iconUrl: talent("silver-warrior", "adrenaline"),
        description:
          "When HP first drops below 40%, restores 15% of lost HP per second for 5s",
      },
      {
        kind: "attribute",
        name: "Energy Armor",
        unlockStars: 12,
        iconUrl: talent("silver-warrior", "energy-armor"),
        description: "HP increased by 15%, ATK increased by 10%",
      },
      {
        kind: "enhance",
        name: "Annihilation Blade",
        unlockStars: 16,
        iconUrl: talent("silver-warrior", "annihilation-blade"),
        description:
          "Godslayer Strike: The final blow from the secondary sword inflicts an extra 300% True Damage and weakens the enemy, reducing their DEF by 20% and Attack by 10% for 6 seconds.",
      },
    ],
    cores: [
      {
        name: "Cavalier Helm",
        skill: "Dawn Slash",
        description: "Dawn Slash adds 50%(150%) of Attack as additional DMG",
      },
      {
        name: "Brawler's Armor",
        skill: "Adrenaline",
        description:
          "Adrenaline additionally restores 6%(18%) of lost HP per second",
      },
      {
        name: "Brawler's Boots",
        skill: "Annihilation Blade",
        // The core calls its containing talent "Blade of Destruction".
        description:
          "Blade of Destruction adds 80%(240%) of Attack as additional True DMG",
      },
      {
        name: "Blade of Valor",
        skill: "Godslayer Strike",
        // The scrolled 11.37.18 capture completes the core description.
        description:
          "Godslayer Strike adds 60%(180%) of Attack as additional Physical DMG",
      },
    ],
    divinities: ["atk", "melee-dmg-reduction"],
  },
  "dark-knight": {
    // Owner screenshots: 2026-09-13 11.35.22–11.35.46 AM, including scrolled duplicates.
    awakeningSkills: [
      {
        stage: "I",
        name: "Undead Guard",
        // The final node says "Undead Guard"; its description says "Undead Guardian".
        description:
          '"Undead Guardian" Upon entering battle, increases all allies\' Magic RES by 10%',
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.22\u202fAM.png",
      },
      {
        stage: "III",
        name: "Death Pact",
        description:
          "Upon receiving fatal damage, dies after 3.5s (during which cannot recover energy)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.24\u202fAM.png",
      },
    ],
    artifact: {
      name: "Sorrow Frost",
      iconUrl: "/artifacts/dark-knight.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Entangle",
          description: "Entangle DMG and Healing effects increased by 10%",
        },
        {
          tier: "gold",
          // The gold tier introduces a standalone ability, not a talent bonus.
          name: "Frost Dark Axe",
          description:
            "Basic ATK reduce the target's MOV SPD by 5% (stackable), lasting 15s. The same target will be silenced for 3s after being attacked 3 times, and loses HP equal to 30% of the Dark Knight's ATK per second.",
        },
        {
          tier: "red",
          skill: "Gloomy Shield",
          description:
            "The release intervals reduced 2.5s. Shield explodes upon its disappearance, dealing Physical DMG equal to 300% of ATK to nearby enemy units with a knockback effect",
        },
        {
          tier: "rainbow",
          name: "Evil Aura",
          description:
            "Upon entering the battlefield, increases the MOV SPD of all allied heroes by 8% and restores HP equal to 10% of the Dark Knight's ATK per second. Allied heroes with less than 35% HP receive an additional 50% healing effect.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Darklight Shield",
        unlockStars: 0,
        iconUrl: talent("dark-knight", "darklight-shield"),
        description:
          "Immediately dispel all debuffs on yourself and apply a Darklight Shield, capable of absorbing DMG equal to 8% of the Dark Knight's HP and converting it into HP (affected by Heavy Injury Effect), lasting for 7s",
      },
      {
        kind: "battle",
        name: "Entangle",
        unlockStars: 2,
        iconUrl: talent("dark-knight", "entangle"),
        description:
          "Attacks have a 25% chance to unleash Death Entangle on the weakest target on the battlefield. If the target is an enemy, it deals True DMG equal to 220% of the ATK. If the target is an ally, it restores HP equal to 220% of the Dark Knight's ATK",
      },
      {
        kind: "enhance",
        name: "Charge",
        unlockStars: 5,
        iconUrl: talent("dark-knight", "charge"),
        description: "Darklight Shield HP conversion increased by 3%",
      },
      {
        kind: "special",
        name: "Gloomy Shield",
        unlockStars: 8,
        iconUrl: talent("dark-knight", "gloomy-shield"),
        description:
          "When self or allied heroes are affected by control-type debuffs (stun, silence, freeze, bound), instantly apply a Gloomy Shield lasting 5s, capable of absorbing DMG equal to 150% of the Dark Knight's ATK and removing debuffs. Can be cast again every 8s",
      },
      {
        kind: "attribute",
        name: "Dark Bloodline",
        unlockStars: 12,
        iconUrl: talent("dark-knight", "dark-bloodline"),
        description: "Knockback Resist increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Undead",
        unlockStars: 16,
        iconUrl: talent("dark-knight", "undead"),
        description:
          "Darklight Shield effect also applies to all other allied heroes, capable of absorbing DMG equal to 5% of the Dark Knight's HP and converting it into their own HP (unaffected by Heavy Injury Effect). Additionally, increases SPD Reduction RES by 20% during the effect. Passive: When the Dark Knight's HP first drops below 30%, immediately cast this skill without consuming energy",
      },
    ],
    cores: [
      {
        name: "Cavalier Helm",
        skill: "Entangle",
        description: "Entangle DMG and healing effect are boosted by 20%(60%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Gloomy Shield",
        description:
          "Gloomy Shield additionally absorbs DMG equal to 50%(150%) of Attack.",
      },
      {
        name: "Brawler's Boots",
        skill: "Undead",
        description:
          "Undead further increases the Life Shield value granted to allies by 1.5%(4.5%).",
      },
      {
        name: "Blade of Valor",
        skill: "Darklight Shield",
        description:
          "Darklight Shield additionally increases its absorbable HP by 1%(3%)",
      },
    ],
    divinities: ["receive-healing", "dmg-reduction"],
  },
  "arcane-saint": {
    // Owner screenshots: 2026-09-13 11.35.50–11.36.14 AM.
    awakeningSkills: [
      {
        stage: "I",
        name: "Gourd Guard",
        description:
          "Upon entering battle, protects the allied hero with the lowest DEF, increasing their Energy gain from damage taken by 80% (effect ends when this unit dies).",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.52\u202fAM.png",
      },
      {
        stage: "III",
        name: "Nature's Power",
        description:
          "Increases all allies' 8% Physical RES and 8% Magic RES each time Golden Holy Bloom is cast (up to a maximum of 2 stacks)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.55\u202fAM.png",
      },
    ],
    artifact: {
      name: "Starshine Staff",
      iconUrl: "/artifacts/arcane-saint.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Sage's Gift",
          description:
            "Sage's Gift has a 50% chance to cleanse some negative effects from allies each time it is cast",
        },
        {
          tier: "gold",
          skill: "Unified",
          description:
            "Unified duration is extended by 8s and additionally increases all allies' 15% Anti-CRIT Rate",
        },
        {
          tier: "red",
          skill: "Golden Holy Bloom",
          description:
            "Golden Holy Bloom increases all allies' MOV SPD by 25% and Energy Regen SPD by 38% after activation, with the effect lasting for 6s",
        },
        {
          tier: "rainbow",
          name: "Summon Beast",
          description:
            "Enters battle and summons two beasts every 16s to assist. Pangolin: Significantly knocks back the enemy at the front and reduces healing received by the enemy by 80% for 8s. Lark: Restores 10% of max HP and 100 energy yourself.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Golden Holy Bloom",
        unlockStars: 0,
        iconUrl: talent("arcane-saint", "golden-holy-bloom"),
        description:
          "Summon Golden Holy Bloom to heal all allies for 180% of ATK over 4s, while reducing all enemies' ATK by 8% for 6s",
      },
      {
        kind: "battle",
        name: "Sage's Gift",
        unlockStars: 2,
        iconUrl: talent("arcane-saint", "sage-s-gift"),
        description:
          "Basic ATK have a 30% chance to throw a Holy Bloom to the weakest ally, restoring 150% of their ATK as HP",
      },
      {
        kind: "enhance",
        name: "Energy Penalty",
        unlockStars: 5,
        iconUrl: talent("arcane-saint", "energy-penalty"),
        description:
          "Golden Holy Bloom reduces the energy recovery SPD of the enemy with the highest total DMG dealt by 80% after activation, with the effect lasting for 7s",
      },
      {
        kind: "special",
        name: "Unified",
        unlockStars: 8,
        iconUrl: talent("arcane-saint", "unified"),
        description:
          "Upon entering battle, increase all allies' ATK by 12% and DEF by 12% within 20s",
      },
      {
        kind: "passive",
        name: "Vigorous",
        unlockStars: 12,
        iconUrl: talent("arcane-saint", "vigorous"),
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Guard Bloom",
        unlockStars: 16,
        iconUrl: talent("arcane-saint", "guard-bloom"),
        description:
          "Golden Holy Bloom Also heals the allied hero with the lowest HP for 30% of lost HP, and grants 20% DMG Reduction for 5s.",
      },
    ],
    cores: [
      {
        name: "Tome of Radiance",
        skill: "Sage's Gift",
        description:
          "Sage's Gift has its activation chance increased by 5%(15%)",
      },
      {
        name: "Luminous Visor",
        skill: "Unified",
        description: "Unified additionally increases Attack and DEF by 1%(3%)",
      },
      {
        name: "Resonance Pendant",
        skill: "Guard Bloom",
        description: "Guard Bloom additionally restores 5%(15%) of lost HP",
      },
      {
        name: "Crystal Staff",
        skill: "Golden Holy Bloom",
        description:
          "Golden Holy Bloom additionally heals for 10%(30%) of Attack as HP",
      },
    ],
    divinities: ["def", "hp"],
  },
  // Dark Faded combines 11.50.20 and its inner-panel scroll at 11.51.47 AM.
  "witch-dictator": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Dark Faded",
        description:
          "The presence of the Witch Dictator instills fear in enemies, increasing all Magic DMG they take by 5%. Additionally, the Witch Dictator's Basic ATKs have a 30% chance to freeze enemies for 1.5s. Passive: All of the Witch Dictator's freeze effects reduce the enemy's energy by 30 (CD: 3 s)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.51.47\u202fAM.png",
      },
      {
        stage: "III",
        name: "Dark Ritual",
        description:
          "Upon entering battle, consumes 3% of current maximum HP and convert into 100 energy (cooldown: 10 s, cannot be activated if HP is below 30%)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.22\u202fAM.png",
      },
    ],
    artifact: {
      name: "Mana Potion",
      iconUrl: "/artifacts/witch-dictator.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Frigid Explosion",
          description:
            "Explosion range increased by 50%, and the slowing effect duration is increased by 3s.",
        },
        {
          tier: "gold",
          skill: "Frost Armor",
          description:
            "Also casts an equivalent Frost Armor on itself. When a protected hero is attacked, the attacker's ATK SPD is reduced by 30% for 3s.",
        },
        {
          tier: "red",
          name: "Withering Fear",
          description:
            "The Witch Dictator strikes fear into his enemies. Increases all enemy Heavy Injury Effect by 50%",
        },
        {
          tier: "rainbow",
          skill: "Frost Echo",
          description:
            "Damage radius increased by 30%, and targets hit have a 75% chance to be frozen for 1.5s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Frost Echo",
        unlockStars: 0,
        iconUrl: talent("witch-dictator", "frost-echo"),
        description:
          "Summon a Frost Nova that bounces between enemies 5 times and creates a small area explosion, dealing Magic DMG equal to 100% of ATK each time",
      },
      {
        kind: "battle",
        name: "Frigid Explosion",
        unlockStars: 2,
        iconUrl: talent("witch-dictator", "frigid-explosion"),
        description:
          "Basic ATK have a 35% chance to create a Frigid Explosion, dealing Magic DMG equal to 35% of ATK to the target. The explosion deals Magic DMG equal to 150% of ATK to surrounding targets and reduces their MOV SPD by 30% for 2s",
      },
      {
        kind: "enhance",
        name: "Ultimate Frost",
        unlockStars: 5,
        iconUrl: talent("witch-dictator", "ultimate-frost"),
        description:
          "Frost Echo decreases the ATK SPD by 35% and MOV SPD by 50% for 3s of hitting the target.",
      },
      {
        kind: "special",
        name: "Frost Armor",
        unlockStars: 8,
        iconUrl: talent("witch-dictator", "frost-armor"),
        description:
          "At set intervals, create a Frost Armor that lasts 8s for the most vulnerable allied hero, increasing their DMG Reduction by 15% and recovers 1% of their Max HP per second.",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("witch-dictator", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Multifrost",
        unlockStars: 16,
        iconUrl: talent("witch-dictator", "multifrost"),
        description:
          "Frost Echo Shooting Count of released Chain Frost New Star Bullets +3",
      },
    ],
    cores: [
      {
        name: "Arcane Hat",
        skill: "Frigid Explosion",
        description:
          "「Frigid Explosion」 now inflicts additional Magic DMG against the primary target equal to 50%(150%) of ATK, and against surrounding enemies equal to 12%(36%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Ultimate Frost",
        description: "「Ultimate Frost」 Slow duration extended by 1(3) s",
      },
      {
        name: "Spell Tome",
        skill: "Frost Armor",
        description:
          "「Frost Armor」 DMG Reduction increased by 5%(15%), Max HP Recovery per second increased by 0.3%(1%)",
      },
      {
        name: "Wizard's Wand",
        skill: "Frost Echo",
        description:
          "「Frost Echo」 now inflicts additional Magic DMG equal to 8%(24%) of ATK",
      },
    ],
    divinities: ["magic-dmg-boost", "magic-res"],
  },
  thrall: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Kinetic Field",
        description:
          "While Thrall is alive, all enemies (excluding illusions and summons) have their movement speed reduced by 10% and control resistance reduced by 30%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.27.26\u202fAM.png",
      },
      {
        stage: "III",
        name: "Guardian Purification",
        // The in-game description spells Thrall as "Thal"; preserve its text.
        description:
          "When casting any skill, randomly dispels some debuffs from one allied hero and restores HP equal to 50% of Thal's ATK every second for 6s (Cooldown: 8s).",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.27.29\u202fAM.png",
      },
    ],
    artifact: {
      name: "Hammer of Destruction",
      iconUrl: "/artifacts/thrall.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Electric storm",
          description:
            "Knockback reduction from the electric storm is increased by 8%.",
        },
        {
          tier: "gold",
          skill: "Thunder Strike",
          description: "Each lightning strike also hits one additional enemy.",
        },
        {
          tier: "red",
          skill: "Guardian Rune",
          description:
            "When applying a Guardian Rune to an ally, reduces their DMG taken by 20% for 8 s, and increases the max HP restored when blocking fatal damage by 16%.",
        },
        {
          tier: "rainbow",
          // Both the talent and artifact popups attach this to Thunder Strike.
          skill: "Thunder Strike",
          description:
            "Each lightning strike briefly reduces the enemy's ATK SPD and MOV SPD significantly, and decreases their Energy Regen SPD by 50% per sec for 6s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Electric storm",
        unlockStars: 0,
        iconUrl: talent("thrall", "electric-storm"),
        description:
          "Creates an unstable electric storm on the battlefield, dealing 100% magic DMG per sec to all enemies and silencing them for 2 s.",
      },
      {
        kind: "battle",
        name: "Thunder Strike",
        unlockStars: 2,
        iconUrl: talent("thrall", "thunder-strike"),
        description:
          "Curses one enemy every 8 s. The cursed enemy will be struck by lightning 3 times over 6 s, each strike dealing 90% true DMG.",
      },
      {
        kind: "enhance",
        name: "Enhanced Storm",
        unlockStars: 5,
        iconUrl: talent("thrall", "enhanced-storm"),
        description:
          "Electric storm: During the storm, all enemies's knockback effects reduced by 12%.",
      },
      {
        kind: "special",
        name: "Guardian Rune",
        unlockStars: 8,
        iconUrl: talent("thrall", "guardian-rune"),
        description:
          "After 6 s in battle, applies a Guardian Rune to the ally with the lowest HP, blocking 1 instances of fatal damage and restoring 20% of their max HP. Each cast increases the CD by 8 s (can be cast up to 2 times per battle, and each ally can only receive the rune once).",
      },
      {
        kind: "passive",
        name: "Orc Soul",
        unlockStars: 12,
        iconUrl: talent("thrall", "orc-soul"),
        description: "Physical RES increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Electric Overload",
        unlockStars: 16,
        iconUrl: talent("thrall", "electric-overload"),
        description:
          "Electric storm: During the electric storm, the lower the target's energy, the more DMG they take, up to an additional 100% DMG. All enemies are stunned for 1 s when the storm ends.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Electric storm",
        description:
          "Electric Storm additionally reduces all Enemies' HP Regen per second by 1.2%(3.6%).",
      },
      {
        name: "Tome of Radiance",
        skill: "Thunder Strike",
        description:
          "Thunder Strike inflicts True DMG equal to 15%(45%) of Attack.",
      },
      {
        name: "Luminous Visor",
        skill: "Guardian Rune",
        description: "Guardian Rune additionally restores 3%(9%) of Max HP.",
      },
      {
        name: "Resonance Pendant",
        skill: "Electric Overload",
        description:
          "Electric Overload raises the maximum additional DMG taken to 130%(200%).",
      },
    ],
    divinities: ["knockback-effect", "anti-crit-rate"],
  },
  necromancer: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Sadist's Heart",
        description:
          "For every enemy killed (excluding summons), gain 3% Ranged DMG Reduction and 0.3% HP Regen per second, stacking up to 5 times.",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.19.39\u202fAM.png",
      },
      {
        stage: "III",
        name: "Necro Possession",
        // Repeated captures end with "until the end"; preserve that wording.
        description:
          "Upon entering battle, grants the ally with the highest ATK (excluding self) 25% Ranged DMG Reduction. This effect decays to 10% after 15 s and lasts until the end",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.22.05\u202fAM.png",
      },
    ],
    artifact: {
      name: "Ghostlight Bone",
      iconUrl: "/artifacts/necromancer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Reaper Scythe",
          description: "Enemies hit have their ATK reduced by 10% for 8s.",
        },
        {
          tier: "gold",
          skill: "Ghost Shield",
          description:
            "Ghost Shield is cast once immediately upon entering battle; when cast for the first time, an additional Ghost Shield is applied to the frontmost allied hero.",
        },
        {
          tier: "red",
          skill: "Death Pulse",
          description:
            "Number of pulses +1. When any ally or self HP drops below 35% for the first time, automatically casts Death Pulse without consuming Energy (triggers once per battle).",
        },
        {
          tier: "rainbow",
          name: "Exhaustion Aura",
          // The 9.19.54 popup's Max Quality footer obscures the remaining text.
          description:
            "Releases Exhaustion Aura upon entering battle, reducing all enemies' DMG by 12% and Energy Regen by…",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Death Pulse",
        unlockStars: 0,
        iconUrl: talent("necromancer", "death-pulse"),
        description:
          "Continuously releases 2 pulse waves around self. Each pulse attacks and heals in both the front and rear directions, dealing 65% ATK as magic DMG to all enemies in front with a knockback effect, while restoring HP equal to 65% of Necromancer's ATK to all allies along the path.",
      },
      {
        kind: "battle",
        name: "Reaper Scythe",
        unlockStars: 2,
        iconUrl: talent("necromancer", "reaper-scythe"),
        description:
          "After 3s in battle, throws the Reaper Scythe to strike the enemy with the highest physical ATK, dealing 375% ATK as magic DMG and stunning for 2.5s. CD: 12s.",
      },
      {
        kind: "enhance",
        name: "Dark Pulse",
        unlockStars: 5,
        iconUrl: talent("necromancer", "dark-pulse"),
        description: "Death Pulse DMG increased by 45%.",
      },
      {
        kind: "special",
        name: "Ghost Shield",
        unlockStars: 8,
        iconUrl: talent("necromancer", "ghost-shield"),
        description:
          "Every 13s, grants self a Ghost Shield, increasing HP Regen by 1% per second and Energy Regen SPD per second by 10% for 8s.",
      },
      {
        kind: "passive",
        name: "Soul Offering",
        unlockStars: 12,
        iconUrl: talent("necromancer", "soul-offering"),
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Necro Arts",
        unlockStars: 16,
        iconUrl: talent("necromancer", "necro-arts"),
        description:
          "Death Pulse healing effect on allies increased by 25%, enemies hit by the pulse lose 40 Energy.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Death Pulse",
        // Source: Screenshot 2026-09-13 at 9.31.17 AM.
        description: "Death Pulse enhances its DMG and Heal by 30% of Attack.",
      },
      {
        name: "Tome of Radiance",
        skill: "Reaper Scythe",
        // The core's text calls the talent "Reaper's Scythe".
        description:
          "Reaper's Scythe inflicts additional Magic DMG equal to 80%(240%) of Attack.",
      },
      {
        name: "Luminous Visor",
        skill: "Ghost Shield",
        // Full core panel: Screenshot 2026-09-13 at 9.21.52 AM.
        description:
          "Ghost Shield further boosts HP Regen by 0.2%(0.6%) and Energy Regen by 2%(6%).",
      },
      {
        name: "Resonance Pendant",
        skill: "Necro Arts",
        description:
          "Necro Arts further amplifies ally recovery effects by 10%(30%).",
      },
    ],
    divinities: ["healing-effect", "crit-dmg-reduction"],
  },
  "shadow-fiend": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Soul Reaping",
        description:
          "For every hero that dies, instantly recover 100 energy and gain 30% ATK SPD for 6s (cannot stack but refresh the duration upon each trigger).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.54.42\u202fAM.png",
      },
      {
        stage: "III",
        name: "Soul Borrowing",
        description:
          "For every enemy on the battlefield, gain an additional 2.5% ATK SPD and 2.5% ATK.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.54.44\u202fAM.png",
      },
    ],
    artifact: {
      name: "Soul Mask",
      iconUrl: "/artifacts/shadow-fiend.png",
      // Only talent-popup bonuses are available; the rainbow tier is unrecorded.
      bonuses: [
        {
          tier: "purple",
          skill: "Soul Burn",
          description:
            "Each Basic ATK and Skill Cast increases ATK by 0.6% (up to 15 stacks).",
        },
        {
          tier: "gold",
          skill: "Destructive Gloom",
          description:
            "Enemies hit by Shadow are stunned for 1s, and 14% of the DMG dealt is converted to the Shadow Fiend's HP.",
        },
        {
          tier: "red",
          skill: "Destructive Gloom",
          // Completed by the owner's scrolled gameplay/talents/image copy.png.
          description:
            "Immediately releases Destructive Gloom once upon entering battle. Physical DMG from Shadow increases by 90%.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Soul Requiem",
        unlockStars: 0,
        iconUrl: talent("shadow-fiend", "soul-requiem"),
        description:
          "Unleashes ghost to deal Physical DMG equal to 250% of ATK to all enemies. Enemies near the Shadow Fiend take 2 times the damage.",
      },
      {
        kind: "battle",
        name: "Soul Burn",
        unlockStars: 2,
        iconUrl: talent("shadow-fiend", "soul-burn"),
        description:
          "Each Basic ATK and Skill Cast increases ATK SPD by 3% (up to 15 stacks).",
      },
      {
        kind: "enhance",
        name: "Ghost Curse",
        unlockStars: 5,
        iconUrl: talent("shadow-fiend", "ghost-curse"),
        description:
          '"Soul Requiem" Ghost striking enemies reduce their Physical RES by 15% and Magic RES by 15% for 6s.',
      },
      {
        kind: "special",
        name: "Destructive Gloom",
        unlockStars: 8,
        iconUrl: talent("shadow-fiend", "destructive-gloom"),
        description:
          "Every 8s, unleashes 3 waves of shadow across a forward area of 200/350/500 yards. Each wave deals 180% Physical DMG to enemies within a medium range.",
      },
      {
        kind: "passive",
        name: "Haunted",
        unlockStars: 12,
        iconUrl: talent("shadow-fiend", "haunted"),
        description: "Armor PEN increased by 10%, ATK increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Spiteful Curse",
        unlockStars: 16,
        iconUrl: talent("shadow-fiend", "spiteful-curse"),
        description:
          '"Soul Requiem" Physical DMG dealt by Ghost is increased by 80%, and Shadow Fiend releases Soul Requiem upon death.',
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Soul Requiem",
        description: "Soul Requiem increases Attack's Physical DMG by 60%.",
      },
      {
        // The popup says "Arrow Core·Core"; only the final UI suffix is removed.
        name: "Arrow Core",
        skill: "Soul Burn",
        description: "Soul Burn additionally increases ATK SPD by 0.5%(1.5%).",
      },
      {
        name: "Hunter's Cloak",
        skill: "Ghost Curse",
        description:
          "Ghost Curse duration increased by 1 (3) s, and additionally reduces Enemies' Ranged DMG Boost by 5%(15%).",
      },
      {
        // The scrolled gameplay/talents/image copy.png shows the full panel.
        name: "Crystal Pendant",
        skill: "Destructive Gloom",
        description:
          "After each cast of Destructive Gloom, gain 6% DMG Reduction for 10 s, with a 100% chance to purge all negative effects from yourself.",
      },
    ],
    divinities: ["physical-dmg-boost", "crit-damage"],
  },
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
